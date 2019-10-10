var Q = require('q');
var mailService = require('../routes/Mail/mailService');
var constants = require("./constants");
var dateFormat = require('dateformat');
var UserModel= require('../models/UserModel');
var RoleModel = require('../models/RoleModel');
var randomstring = require("randomstring");
var passwordHash = require('password-hash');
var organizationUtils = require('./organizationUtils');
var apiUtils = require('./apiUtils');

var userUtils = {
    add : function(jsonUser, orgId, acl, url, isPayee) {
        var deferred = Q.defer();
        var passwordToken = randomstring.generate(8)+ Date.now();
        var password=randomstring.generate(10);
        var passcode=randomstring.generate(8);
        var userInstance = new UserModel({
            firstName: jsonUser.firstName,
            middleName: jsonUser.middleName,
            lastName: jsonUser.lastName,
            email: jsonUser.email,
            phoneNumber: jsonUser.mobileno,
            passwordToken: passwordToken,
            password: passwordHash.generate(password),
            passcode: passwordHash.generate(passcode),
            roles: [],
            first_time_login: true,
            organization: orgId
        });
        if(jsonUser.signature){
            userInstance.signature.filename = jsonUser.signature.filename;
            userInstance.signature.filetype = jsonUser.signature.filetype;
            userInstance.signature.filesize = jsonUser.signature.filesize;
            userInstance.signature.base64 = jsonUser.signature.base64;
        }
        var isAdmin = false;
        RoleModel.where('name').in(jsonUser.role).exec(function(error, roles){
            console.log('-------0000000--------',roles);
            if(roles) {
                for (var i=0; i < roles.length; i++) {
                    if (roles[i].name === 'ROLE_MASTERADMIN') {
                        isAdmin = true;
                    }
                    userInstance.roles.push(roles[i].name);
                }
            }
            // call the built-in save method to save to the database
            userInstance.save(function(error, newUser){
                if (error){
                    deferred.reject(apiUtils.i18n('payment.requester.save.error.msg'));
                }
                acl.addUserRoles( newUser._id.toString(), newUser.roles, function(errorOnAddRemoveRoles) {
                    if (errorOnAddRemoveRoles){
                        deferred.reject(apiUtils.i18n('user.acl.roles.save.error.msg'));
                    }
                    newUser.password = password;
                    newUser.passcode = passcode;
                    if (isAdmin) {
                        organizationUtils.addAdminUser(orgId, newUser._id).then(function(organization){
                            require('../routes/Mail/mailService').sendEmailOnUserCreation(newUser, organization, url);
                            deferred.resolve(newUser);
                        }, function(error){
                            deferred.reject(apiUtils.i18n('admin.user.add.error.msg'));
                        })
                    } else {
                        organizationUtils.getById(orgId).then(function(organization){
                            try {
                                require('../routes/Mail/mailService').sendEmailOnUserCreation(newUser, organization, url, isPayee);
                            } catch(error) {
                                console.log("Error while sending email: ",error);
                            }
                            deferred.resolve(newUser);
                        }, function(error){
                            deferred.reject(apiUtils.i18n('notification.send.email.to.user.error.msg'));
                        })
                    }
                });
            })
        });
        return deferred.promise;
    },
    isValid : function ( email, mobileno ) {
        var deferred = Q.defer();
        var emailPromise = userUtils.getCountByQuery( {'email': email});
        var mobilePromise = userUtils.getCountByQuery( {'phoneNumber': mobileno});
        Q.allSettled( [emailPromise, mobilePromise] ).then(function (resp) {
            if (resp[0].value === 0 && resp[1].value === 0 ){
                deferred.resolve(true);
            } else if (resp[0].value !== 0) {
                deferred.reject(apiUtils.i18n('user.exist.with.same.email.error.msg'));
            } else {
                deferred.reject(apiUtils.i18n('user.exist.with.same.mobile.error.msg'));
            }
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    },
    getCountByQuery: function(query) {
        var deferred = Q.defer();
        UserModel.count(query).exec(function(err, count){
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    },
    validateUser: function(req, userId, oldPhoneNo, isPayee) {
        if (!userId){
            req.check('q.email', apiUtils.i18n('user.invalid.email.error.msg')).isEmail();
            req.check('q.email', apiUtils.i18n('user.unique.email.error.msg')).isUniqueEmail(req.currentUser.organization, isPayee);
            req.check('q.mobileno', apiUtils.i18n('user.unique.phone.error.msg')).isUniquePhone(req.currentUser.organization, true, isPayee);
        }
        else {
            req.check('q.mobileno', apiUtils.i18n('user.unique.phone.error.msg')).isUpdatedPhoneNumberUnique(oldPhoneNo, req.currentUser.organization, userId, isPayee);
        }
        req.check('q.firstName', apiUtils.i18n('user.first.name.required.error.msg')).len(1);
        req.check('q.lastName', apiUtils.i18n('user.last.name.required.error.msg')).len(1);
        req.check('q.mobileno', apiUtils.i18n('user.phone.required.error.msg')).len(1);
        var deferred = Q.defer();
        req.asyncValidationErrors().then(function (user) {
            deferred.resolve(user);
        }, function (errors) {
            deferred.reject(errors);
        });
        return deferred.promise;
    },
    getUserByRoles: function (roles, organization) {
        var deferred = Q.defer();
        var query = { $and: [ {roles: { $in: roles }}, {organization: organization} , {enabled : true} ] };
        UserModel.find(query)
            .select({ email: 1, _id:0})
            .exec(function(error, users) {
                if(error) {
                    deferred.reject(error);
                    return;
                }
                var emailList = apiUtils.getValuesByKey(users, 'email');
                deferred.resolve(emailList);

            });
        return deferred.promise;
    },
    deleteUser : function( userId, currentUser) {
        var deferred = Q.defer();
        UserModel.findOne({ _id : userId }, function(error, user) {
            var result = userUtils.isLoginUser(currentUser.email,user.email);
            if(user && !result) {
                user.enabled = !user.enabled;
                user.save(function(err) {
                    if (err) {
                        deferred.reject(error);
                    }
                    deferred.resolve(user);
                });
            }else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    },
    /**
     * Removes document from mongo DB,
     * @param userId
     * @param currentUser
     * @returns {*}
     */
    removeUser : function( userId, currentUser) {
        var deferred = Q.defer();
        UserModel.findOne({ _id : userId }, function(error, user) {
            if(user && user.email !== currentUser.email) {
                user.remove(function(err) {
                    if (err) {
                        deferred.reject(error);
                    }
                    deferred.resolve(user);
                });
            }else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    },
    isLoginUser : function( loginUser,modUser) {
        if(loginUser === modUser) {
            return true;
        }
        return false;
    },
    getUserById: function(id){
        var deferred = Q.defer();
        UserModel.findOne({_id:id},function(err,user){
            if(err){
                deferred.reject(err);
            }
            else{
                deferred.resolve(user);
            }
        });
        return deferred.promise;
    }
};
module.exports = userUtils;
