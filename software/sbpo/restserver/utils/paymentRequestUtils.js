var Q = require('q');

var status = require('../enums/status');
var adviceUtils = require('./adviceUtils');
var constants = require('../utils/constants');
var mongoose = require('mongoose');
var apiUtils= require('./apiUtils');
var PaymentRequesterModel = require('../models/PaymentRequester');
var PaymentRequestModel = require('../models/PaymentRequestModel');


var paymentRequestUtils = {
    //populate advice from payment
    populateAdviceFromPayment: function(currentUser, paymentRequest, organization) {
        var deferred = Q.defer();
        var queryParams = {
            payee: { '_id': paymentRequest.payee },
            selectedProject: { '_id': paymentRequest.project },
            cashAmt: paymentRequest.amount,
            status: status.DRAFT.value,
            paymentType: paymentRequest.paymentType,
            //@todo: change it correct way
            //initiatedBy: currentUser.firstName + " " + currentUser.lastName,
            //userId: currentUser._id,
            initiatedBy: "some name",
            userId: '123',
            //@todo: change it correct way

            selectedPurpose: paymentRequest.purpose
        };
        adviceUtils.createNewAdvice(queryParams, organization).then(function(advice){
            deferred.resolve(advice);
        }, function(error){
            deferred.reject(error);
        });
        return deferred.promise;
    },

    savePaymentRequester : function(user, project) {
        var deferred = Q.defer();
        var assignedProject = mongoose.Types.ObjectId(project._id);

        var paymentRequesterObj = {
            assignedProject: assignedProject,
            user: mongoose.Types.ObjectId(user._id),
            organization: mongoose.Types.ObjectId(user.organization)
        };
        var paymentRequesterInstance = new PaymentRequesterModel(paymentRequesterObj);

        paymentRequesterInstance.save(function(error, newUser){
            if (error){
                deferred.reject(apiUtils.i18n('payment.requester.save.error.msg'));
            }
            else {
                deferred.resolve(newUser)
            }
        });
        return deferred.promise;
    },

    updatePaymentRequester : function(userId, projects, orgId) {
        var deferred = Q.defer();
        var assignedProject = mongoose.Types.ObjectId(projects._id);

        var query = { user : userId, organization: orgId};

        PaymentRequesterModel.findOne(query,function(err,paymentRequester){
            if(err){
                deferred.reject(apiUtils.i18n('payment.requester.search.error.msg'))
            }
            else{
                var paymentRequesterObj
                if(paymentRequester) {//if payment requester exists
                    paymentRequesterObj = {
                        assignedProject: assignedProject,
                        user: mongoose.Types.ObjectId(paymentRequester.user),
                        organization: mongoose.Types.ObjectId(orgId)
                    };
                    PaymentRequesterModel.update({ _id: paymentRequester._id }, paymentRequesterObj, function(error,data){
                        if (error) {
                            deferred.reject(apiUtils.i18n('payment.requester.update.error.msg'));
                        } else {
                            deferred.resolve(data)
                        }
                    });
                }
                else {//if payment requester not exists then create new payment requester user
                    paymentRequesterObj = {
                        assignedProject: assignedProject,
                        user: mongoose.Types.ObjectId(userId),
                        organization: mongoose.Types.ObjectId(orgId)
                    };
                    var paymentRequesterInstance = new PaymentRequesterModel(paymentRequesterObj);

                    paymentRequesterInstance.save(function(error, newUser){
                        if (error){
                            deferred.reject(apiUtils.i18n('payment.requester.save.error.msg'));
                        }
                        else {
                            deferred.resolve(newUser)
                        }
                    });
                }

            }
        })
        return deferred.promise;
    },
    deletePaymentRequester: function(userId,orgId) {
        var deferred = Q.defer();
        var query = { user : userId, organization: orgId};
        PaymentRequesterModel.findOne(query, function(error, user) {
            if(user) {
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
    getPaymentRequestStatus: function(paymentReqStatus, user, queryParam) {
        var query = {};
        query.organization = user.organization;
        if(queryParam && queryParam.project && user.roles.indexOf(constants.PAYMENT_REQUEST_ROLES.ROLE_PAYMENT_REQUESTER) !== -1) {
            query.project = mongoose.Types.ObjectId(queryParam.project);
            query.requestedUser = mongoose.Types.ObjectId(user._id)
        }
        if(paymentReqStatus  === constants.PAYMENT_REQUEST_STATUS.APPROVED) {
            query.status = [constants.PAYMENT_REQUEST_STATUS.APPROVED]
        }
        else if(paymentReqStatus === constants.PAYMENT_REQUEST_STATUS.SUBMITTED) {
            query.status = [constants.PAYMENT_REQUEST_STATUS.SUBMITTED]
        }
        else if(paymentReqStatus === constants.PAYMENT_REQUEST_STATUS.REJECTED) {
            query.status = [constants.PAYMENT_REQUEST_STATUS.REJECTED];
        }
        else {
            query.status = { $in: [
                constants.PAYMENT_REQUEST_STATUS.APPROVED,
                constants.PAYMENT_REQUEST_STATUS.REJECTED,
                constants.PAYMENT_REQUEST_STATUS.SUBMITTED
            ] };
        }
        return query;
    },

    getPaymentRequestById:function(paymentRequestId){
        var deferred = Q.defer();
        PaymentRequestModel.findOne({_id:paymentRequestId},function(err,paymentRequest){
            if(paymentRequest){
                deferred.resolve(paymentRequest);
            }
            else {
                deferred.reject(false);
            }
        });
        return deferred.promise;
    },
    getTotalProjectCount:function(query){
        var deferred=Q.defer();
        PaymentRequestModel.aggregate(query).exec(function (err, paymentRequestCount) {
            if(err){
                deferred.reject('');
            }
            else{
                deferred.resolve(paymentRequestCount.length)
            }
        });
        return deferred.promise
    }
};

module.exports = paymentRequestUtils;
