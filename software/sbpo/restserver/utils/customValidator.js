var expressValidator = require('express-validator');
var UserModel = require('../models/UserModel');
var PayeeModel= require('../models/PayeeModel');
var apiUtils = require('../utils/apiUtils');
var mongoose = require('mongoose');

module.exports = expressValidator({
    customValidators: {
        isUniqueEmail: function (email, org, isPayeeUser) {
            return new Promise(function (resolve, reject) {
                var emailPattern = '^'+email.trim()+'$';
                var emailRegex = new RegExp(emailPattern, 'i');
                if(isPayeeUser) {
                    PayeeModel.find({expired:true, organization:org}, { user: 1, "_id":0}).exec(function (err, payeeDocs) {
                        if (err) { reject(er); }
                        else {
                            var payeeUsers = [];
                            payeeDocs.forEach(function(payeeDoc, ind){
                                payeeUsers.push(payeeDoc.user);
                            });
                            var query = {email:emailRegex, organization:org, "_id":{"$nin": payeeUsers}};
                            UserModel.count(query).then(function (data) {
                                if (data == 0) { resolve(apiUtils.i18n('user.unique.email.success.msg')); }
                                else { reject(apiUtils.i18n('user.unique.email.error.msg')); }
                            }).catch(function (error) {
                                if (error) { reject(error); }
                            })
                        }
                    })
                } else {
                    UserModel.count({email: emailRegex, organization: org}, function (error, userCount) {
                        if (error) {
                            reject(error);
                        } else if (userCount == 0) {
                            resolve();
                        } else {
                            reject();
                        }
                    });
                }
            });
        },
        isUniquePhone: function (phone, org, existingUser, isPayeeUser) {
            return new Promise(function (resolve, reject) {
                if(isPayeeUser) {
                    PayeeModel.find({expired:true, organization:org}, { user: 1, "_id":0}).exec(function (err, payeeDocs) {
                        if (err) { reject(er); }
                        else {
                            var payeeUsers = [];
                            payeeDocs.forEach(function(payeeDoc, ind){
                                payeeUsers.push(payeeDoc.user);
                            });
                            var query = {phoneNumber:phone, organization:org, "_id":{"$nin": payeeUsers}};
                            UserModel.count(query).then(function (data) {
                                if (data == 0) { resolve(apiUtils.i18n('user.unique.phone.success.msg')); }
                                else { reject(apiUtils.i18n('user.unique.phone.error.msg')); }
                            }).catch(function (error) {
                                if (error) { reject(error); }
                            })
                        }
                    })
                } else {
                    UserModel.count({phoneNumber: phone, organization: org})
                        .then(function (data) {
                            if (data == 0) {
                                resolve(apiUtils.i18n('user.unique.phone.success.msg'));
                            }
                            else {
                                reject(apiUtils.i18n('user.unique.phone.error.msg'));
                            }
                        })
                        .catch(function (error) {
                            if (error) {
                                reject(error);
                            }
                        })
                }
            });
        },
        isUpdatedPhoneNumberUnique:function(newPhoneNo, oldPhoneNo, org, userId, isPayeeUser) {
            return new Promise(function(resolve, reject){
                if(newPhoneNo === oldPhoneNo) {
                    /* If phone number is not updated then resolve it */
                    resolve(apiUtils.i18n('user.unique.phone.success.msg'));
                } else {
                    if(isPayeeUser) {
                        PayeeModel.find({expired:true, organization:org}, { user: 1, "_id":0}).exec(function (err, payeeDocs) {
                            if (err) { reject(er); }
                            else {
                                var payeeUsers = [];
                                payeeDocs.forEach(function(payeeDoc, ind){
                                    payeeUsers.push(payeeDoc.user);
                                });
                                payeeUsers.push(userId); //current edited user
                                var query = {phoneNumber:newPhoneNo, organization:org, "_id":{"$nin": payeeUsers}};
                                UserModel.count(query).then(function (data) {
                                    if (data == 0) { resolve(apiUtils.i18n('user.unique.phone.success.msg')); }
                                    else { reject(apiUtils.i18n('user.unique.phone.error.msg')); }
                                }).catch(function (error) {
                                    if (error) { reject(error); }
                                })
                            }
                        })
                    } else {
                        UserModel.count({phoneNumber:newPhoneNo, organization:org, "_id" : {"$ne":userId}})
                            .then(function(data){
                                if(data == 0) {resolve(apiUtils.i18n('user.unique.phone.success.msg')); }
                                else {reject(apiUtils.i18n('user.unique.phone.error.msg')); }
                            })
                            .catch(function(error){
                                if (error) { reject(error); }
                            })
                    }
/*                    UserModel.count({phoneNumber:newPhoneNo, organization:org, "_id" : {"$ne":userId}})
                        .then(function(data){
                            if(data == 0) {resolve(apiUtils.i18n('user.unique.phone.success.msg')); }
                            else {reject(apiUtils.i18n('user.unique.phone.error.msg')); }
                        })
                        .catch(function(error){
                            if (error) { reject(error); }
                        })*/
                }
            });
        },
        isUniqueNickName: function (nickName, org, payeeId) {
            return new Promise(function (resolve, reject) {
                var nickNameString = new RegExp(["^", nickName, "$"].join(""), "i");
                if(payeeId) {
                    PayeeModel.count({nickName:nickNameString, "expired" : false ,organization:org, "_id" : {"$ne":payeeId}})
                        .then(function(data){
                            if(data == 0) {resolve(apiUtils.i18n('payee.unique.nickname.success.msg')); }
                            else {reject(apiUtils.i18n('payee.unique.nickname.error.msg')); }
                        })
                        .catch(function(error){
                            if (error) { reject(error); }
                        })
                }
                else {
                    PayeeModel.count({nickName:nickNameString,"expired" : false, organization:org})
                        .then(function(data){
                            if(data == 0) { resolve(apiUtils.i18n('payee.unique.nickname.success.msg')); }
                            else { reject(apiUtils.i18n('payee.unique.nickname.error.msg')); }
                        })
                        .catch(function(error){
                            if (error) { reject(error); }
                        })
                }
            });
        }
    }
});
