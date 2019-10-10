var mongodb = require('mongodb');
var mongoose = require('mongoose');
var app = require('../../../../server');
var randomstring = require("randomstring");
var passwordHash = require('password-hash');
var Q = require('q');

exports.up = function(db, next) {
    var payees = db.collection('payees');
    var users = db.collection('users');
    var roles = db.collection('roles');

    /*Added a new role: Payee*/
    roles.update({"name":"ROLE_PAYEE"}, {"$set":{"name":"ROLE_PAYEE", __v:0}}, {"upsert":true});

    var payeeCount = 0, i=1;
    payees.count({'user':{'$exists':false}}).then(function (count) {
        payeeCount = count;
        if (payeeCount>0) {
            /*Find all payees which are not associated with user and create user for them */
            payees.find({'user':{'$exists':false}}).forEach(function(payee){

                var passwordToken = randomstring.generate(8)+ Date.now();
                var password = passwordHash.generate('Password123');
                var passcode = passwordHash.generate('Passcode');
                var userId = new mongoose.Types.ObjectId();

                var userTokens = payee.name.split(" ");
                var firstName = "", lastName = "", emaillastName = "";
                userTokens.forEach(function(token, index){
                    token = token.trim();
                    if(index == 0) { firstName = token }
                    else {
                        if(index == 1) {
                            emaillastName = token
                        }
                        lastName = lastName +' '+token
                    }
                });
                var email = payee.email;
                if(!email) {
                    email = (
                        (
                        (firstName.replace(/\-/g, '').replace(/ /g, '.').replace(/\(/g,'').replace(/\)/g,'').replace(/\//g,'').replace(/\\/g,'').replace(/\&/g, '')).toLowerCase().trim()
                        +"."+
                        (emaillastName.replace(/\-/g, '').replace(/ /g, '.').replace(/\(/g,'').replace(/\)/g,'').replace(/\//g,'').replace(/\\/g,'').replace(/\&/g, '')).toLowerCase().trim()
                        +(Math.floor(Math.random() * (payeeCount - i + 1)) + i)+"@payee.com")).trim();
                    setTimeout(function(){
                        console.log("email>>",email)
                    },200);
                }
                if(lastName === "") { lastName = "  " }

                var userObj = {
                    "_id" : userId,
                    "firstName" : firstName,
                    "middleName" : "",
                    "lastName" : lastName,
                    "email" : email,
                    "phoneNumber" : payee.phoneNumber,
                    "passwordToken" : passwordToken,
                    "password" : password,
                    "passcode" : passcode,
                    "first_time_login" : true,
                    "organization" : payee.organization,
                    "enabled" : false,
                    "roles" : ["ROLE_PAYEE"],
                    __v:0
                };

                var updatedPayeeObj = {
                    "bankName" : randomstring.generate({length:8,charset:'alphabetic'}),
                    "ifscCode" : randomstring.generate({length:8,charset:'alphanumeric'}),
                    "bankBranch" : randomstring.generate({length:8,charset:'alphabetic'}),
                    "accountNumber" : randomstring.generate({length:8,charset:'numeric'}),
                    "organization" : payee.organization,
                    "user" : userId,
                    "payeeNumber" : randomstring.generate({length:8,charset:'numeric'}),
                    "expired" : false,
                    __v:0
                };

                /*Check for duplicate email id */
                users.findOne({email: payee.email, organization : payee.organization['_id']}).then(function(userDoc){
                    if(!userDoc) {
                        //users.insert(userObj);
                        users.insertOne(userObj, function(error, newPayeeUser) {
                            if (error) {
                                console.log('Error occurred while saving payee user: ' + error);
                            } else {
                                console.log('New payee user is saved: ' + newPayeeUser);
                                updateACLRoles(userObj).then(function(res){
                                    console.log('Acl role is added: ');
                                })
                            }
                        })
                        payees.update({_id:payee['_id']}, {"$set":updatedPayeeObj, "$unset":{'name':"", 'phoneNumber':"", 'email':""}});
                    } else {
                        console.log("Migration action skipped for payee with id: "+payee['_id']+" due to duplicate email")
                    }
                    if(i===payeeCount) {
                        //Removing the email from tokens table
                        console.log('Migrated all payees');
                        next();
                    }
                    i++;
                })
            })
        } else {
            next();
        }
    })
};

exports.down = function(db, next){ next(); };

function updateACLRoles(user){
    var deferred = Q.defer();
    app.locals.acl.addUserRoles(user._id.toString(), user.roles, function (errorOnAddRemoveRoles) {
        if (errorOnAddRemoveRoles) {
            console.log('Error occurred while saving acl roles' + errorOnAddRemoveRoles);
            deferred.reject(error)
        }
        deferred.resolve();
    });
    return deferred.promise;
}