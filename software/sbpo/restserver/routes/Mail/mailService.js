/**
 * Created by Ashish Lamse on 9/9/16.
 */
var userModel=require('../../models/UserModel');
var projectModel=require('../../models/ProjectModel');
var errorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var apiUtils = require('../../utils/apiUtils');
var feedbackModel=require('../../models/feedbackModel');
var OrganizationModel=require('../../models/OrganizationModel');
var manageNotificationModele=require('../../models/manageNotificationModele');
var notificationModel=require('../../models/notificationModel');
var mail_send=require('./mailDelivery');
var Q = require('q');
var appConfig = require('../../utils/apiUtils').getExternalConfigFile();
var constants = require('../../utils/constants');
var i18n = require("i18n");
var userUtils = require('../../utils/userUtils');

i18n.configure({
    locales:['en'],
    directory: __dirname + '/locales'
});

var sendMail={
    sendEmailOnUserCreation:function(user, organization, serverUrl, isPayee) {
        var mailConfig=appConfig.mail;
        var locals = {
            fullName: user.firstName + ' ' + user.lastName,
            toEmail: user.email,
            subject: mailConfig.addUserSubject,
            url:  serverUrl,
            password:user.password,
            passcode:user.passcode,
            organization: organization.name,
            userType:'user'
        };
        if(isPayee) { locals.userType = 'payee' }
        mail_send.mailDelivery('welcome_email', locals);
    },

    sendEmailOnOrgCreation:function(organization, adminUser, serverUrl) {
        var mailConfig=appConfig.mail;
        var locals = {
            toEmail: adminUser.email,
            subject: mailConfig.newOrganization,
            url:  serverUrl,
            name: organization.name,
            domain: organization.subDomain,
            code: organization.code,
            sector: organization.sector,
            admin_name:adminUser.firstName + ' ' + adminUser.lastName,
            admin_email:adminUser.email
        };
        mail_send.mailDelivery('welcome_to_ipass', locals);
    },
    disburserAdviceEmail:function(advice,fun){
        var mailConfig=appConfig.mail;
        var sender=appConfig.mail.auth;
        var otherinfo=appConfig.mail;

        var ccArray=[];
        ccArray.push(advice.secondLevelApprover.email);
        ccArray.push(advice.thirdLevelApprover.email);
        ccArray.push(advice.user.email);
        ccArray.push(advice.disburser.email);
        var payeeName = (advice.payee.user.firstName+' '+advice.payee.user.middleName+' '+advice.payee.user.lastName);
        var locals = {
            toEmail: advice.payee.user.email,
            fullName: payeeName,
            adviceNumber: advice.adviceNumber,
            payeeName: payeeName,
            projectName: advice.project.projectName,
            requestedAmount: apiUtils.indiaCurrencyFormat(Number(advice.requestedAmount))+"Rs. ("+apiUtils.convertINRToWord(Number(advice.requestedAmount))+")",
            subject: mailConfig.disbursedSubject,
            cc: ccArray
        };
        getProjectNotificationMail(advice.project._id).then(function(projectNotificationMail){
            ccArray=ccArray.concat(projectNotificationMail);
            manageNotificationModele.findOne({type : "disburse"},function(err,data){
                if(err){
                    console.log(err)
                }
                else if(data===null || data===undefined) {
                    mail_send.mailDelivery('disburser_advice', locals);
                    fun({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
                }
                else{
                    if(data.is_email=== true){
                        notificationModel.find({type : "email"},function(err,data){
                            data.forEach(function(emailData){
                                ccArray.push(emailData.contact);
                            });

                            locals.cc=ccArray;
                            mail_send.mailDelivery('disburser_advice', locals);
                            mail_send.mailDelivery('disburser_advice', locals);
                            fun({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
                        })
                    }
                    else {
                        locals.cc=ccArray;
                        mail_send.mailDelivery('disburser_advice', locals);
                        fun({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
                    }
                }
            });

        });
    },
    feedbackMail:function(req,res){
        var requestParam=req.body;
        var text='';
        if(requestParam.description===undefined){
            requestParam.description='';
        }
        new feedbackModel({
            reportedBy:requestParam.reportedBy,
            feedbackStatus:requestParam.feedbackValue,
            title:requestParam.title,
            description:requestParam.description,
            organization:req.currentUser.organization
        }).save(function(error,feedback){
            if(error){
                res.send(new errorResult('FAILED', "Error", error))
            }else{
                OrganizationModel.findOne({_id :req.currentUser.organization },{name : -1},function(err,data){
                    if(err){
                        console.log("error");
                        console.log(err);
                    }
                    else if(data===undefined || data===null){
                        console.log("data");
                        console.log(data);
                    }
                    else{
                        var sender=appConfig.mail.auth;
                        var toMail=['ritesh.pyapali@india.semanticbits.com','ashish.lamse@india.semanticbits.com','surendra.pattebahadur@india.semanticbits.com',
                            'sukesh.ratnalu@india.semanticbits.com','sridhar.thumma@india.semanticbits.com'];
                        var otherinfo=appConfig.mail;
                        var querParam=req.body;

                        var feedbackSubject='';
                        if(requestParam.feedbackValue=='Bug'){
                            feedbackSubject=appConfig.mail.bugNotification;
                            text='a bug'
                        }else{
                            feedbackSubject=appConfig.mail.enhancementNotification;
                            text='an enhancement / feedback'

                        }
                        var locals = {
                            organization:data.name,
                            fullName: appConfig.mail.iPASSDevTeam,
                            subject: feedbackSubject,
                            password:sender.pass,
                            reportedBy:requestParam.reportedBy,
                            description:requestParam.description,
                            title:requestParam.title,
                            cc:toMail,
                            text:text
                        };
                        mail_send.mailDelivery('feedback_form', locals);
                        res.send( new SuccessResponse('OK', "Feedback Send", "", apiUtils.i18n('request.success.msg')) );
                    }

                });


            }
        });

    },
    sendMailForCreateLegacyAdvice:function(data,organization,advice,fun){
        var ccRecipients=[];
        var query = { roles: { $in: ["ROLE_MASTERADMIN"]},organization: organization };
        userModel.find(query,function(err,adminUsers){
            if(err){
                console.log("error")
            }
            else{
                var count=0;
                adminUsers.forEach(function(eachAdmin){
                    if(count!==0){
                        ccRecipients.push(eachAdmin.email);
                    }
                    count++;
                });
                var payeeName = (data.payee.nickName);

                console.log("____data_",data);




                var locals = {
                    toEmail:adminUsers[0].email,
                    fullName: payeeName,
                    adviceNumber: advice.adviceNumber,
                    payeeName:payeeName,
                    projectName:data.selectedProject.projectName,
                    requestedAmount:apiUtils.indiaCurrencyFormat(Number(data.requestedAmt))+"Rs.  ("+apiUtils.convertINRToWord(Number(data.requestedAmt))+")",
                    subject: "iPASS Legacy Advice Created",
                    cc:ccRecipients
                };

                getProjectNotificationMail(data.selectedProject._id).then(function(projectNotificationsEmails){
                    console.log("___projectNotificationsEmails____",projectNotificationsEmails)
                    /* ccRecipients = ccRecipients.concat(projectNotificationsEmails);*/
                    updateRecipientsWithNotification(ccRecipients).then(function(response){
                        ccRecipients=response.concat(projectNotificationsEmails);
                        locals.cc=ccRecipients;
                        mail_send.mailDelivery('create_advice', locals);
                        fun({res:constants.ADVICE_STATUS.STATUS_SUCCESS});
                    });
                });
            }

        });

    },
    sendMailForApproval:function(advice, recipients) {
        var deferred = Q.defer();
        prepareDataForApprovedAdvice(advice, recipients).then(function(locals){
            mail_send.mailDelivery('approve_advice', locals);
            deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
        });
        return deferred.promise;
    },
    sendMailForApprovePaymentRequest:function(advice){
        var deferred = Q.defer();
        prepareLocalForPaymentReqOperations(advice,constants.PAYMENT_REQUEST_SUBJECT.APPROVED).then(function(locals){
            mail_send.mailDelivery('approve_payment_request', locals);
            deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
        });
        return deferred.promise;
    },
    sendMailForRejectPaymentRequest:function(advice){
        var deferred = Q.defer();
        prepareLocalForPaymentReqOperations(advice,constants.PAYMENT_REQUEST_SUBJECT.REJETED).then(function(locals){
            mail_send.mailDelivery('reject_advice_payment_request', locals);
            deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
        });
        return deferred.promise;
    },
    sendMailForDisbursePaymentRequest:function(advice){
        var deferred = Q.defer();
        prepareLocalForPaymentReqOperations(advice,constants.PAYMENT_REQUEST_SUBJECT.DISBURESD).then(function(locals){
            mail_send.mailDelivery('disburse_advice_payment_request', locals);
            deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
        });
        return deferred.promise;
    },

    sendMailForRejection:function(advice, recipients){
        var deferred = Q.defer();
        prepareDataForRejectedAdvice(advice, recipients).then(function(locals){
            mail_send.mailDelivery('reject_advice', locals);
            deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
        });
        return deferred.promise;
    },

    sendMailOnCreatePaymentRequest:function(paymentRequestInstance,queryParams,recipients,user){
        var deferred = Q.defer();
        var mailConfig=appConfig.mail;

        var fullName = apiUtils.prepareFullName(user);
        //var payeeName =apiUtils.prepareFullName(queryParams.payee.user);
        var payeeName = queryParams.payee.nickName;

        var ccRecipients=JSON.parse(JSON.stringify(recipients));
        ccRecipients.splice(0, 1);

        var locals = {
            toEmail: recipients[0],
            subject: constants.PAYMENT_REQUEST_SUBJECT.CREATED,
            fullName:fullName,
            payeeName: payeeName,
            projectName:queryParams.project.projectName,
            payment_req_number:paymentRequestInstance.paymentRequestNumber,
            requestedAmount:apiUtils.indiaCurrencyFormat(Number(queryParams.requestedAmount))+"Rs.  ("+apiUtils.convertINRToWord(Number(queryParams.requestedAmount))+")",
            cc:ccRecipients
        };
        mail_send.mailDelivery('create_payment_request', locals);
        deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});
        return deferred.promise;
    },
    sendMailOnRejectPaymentRequest:function(rejectedPaymentRequest){
        var deferred = Q.defer();
        var mailConfig=appConfig.mail;
        userModel.findOne({_id:rejectedPaymentRequest.payee.user},function(err,payeeData){
            if(err){
                deferred.reject(err);
            }
            else {
                var mailConfig=appConfig.mail;
                var payeeName = apiUtils.prepareFullName(payeeData);
                var fullName = apiUtils.prepareFullName(rejectedPaymentRequest.requestedUser);

                var locals = {
                    toEmail: rejectedPaymentRequest.requestedUser.email,
                    subject:  constants.PAYMENT_REQUEST_SUBJECT.REJETED,
                    payeeName: payeeName,
                    fullName:fullName,
                    projectName:rejectedPaymentRequest.project.projectName,
                    payment_req_number:rejectedPaymentRequest.paymentRequestNumber,
                    requestedAmount:apiUtils.indiaCurrencyFormat(Number(rejectedPaymentRequest.amount))+"Rs.  ("+apiUtils.convertINRToWord(Number(rejectedPaymentRequest.amount))+")",
                };
                mail_send.mailDelivery('reject_payment_request', locals);
                deferred.resolve({status:constants.ADVICE_STATUS.STATUS_SUCCESS});

            }
        });

        return deferred.promise;

    },
    sendMailOnInitiatePaymentRequest:function(advice) {
        var deferred = Q.defer();
        var mailConfig = appConfig.mail;

        apiUtils.getPaymentRequestById(advice.paymentRequestId).then(function (paymentRequest) {
            apiUtils.getUserById(paymentRequest.requestedUser).then(function (paymentRequestUser) {
                var fullName = apiUtils.prepareFullName(paymentRequestUser);
                var paymentRequestPayeeName = apiUtils.prepareFullName(paymentRequest.payee.user);
                var advicePayeeName = apiUtils.prepareFullName(advice.payee.user);

                var locals = {
                    toEmail: paymentRequestUser.email,
                    subject: constants.PAYMENT_REQUEST_SUBJECT.INITIATED,
                    fullName: fullName,
                    /*payment request details*/
                    payment_req_number: paymentRequest.paymentRequestNumber,
                    paymentRequestProjectName: paymentRequest.project.projectName,
                    paymentRequestPayeeName: paymentRequestPayeeName,
                    paymentRequestAmount: apiUtils.indiaCurrencyFormat(Number(paymentRequest.amount.value)) + "Rs.  (" + apiUtils.convertINRToWord(Number(paymentRequest.amount.value)) + ")",

                    /*advice details*/
                    advicePayeeName: advicePayeeName,
                    adviceProjectName: advice.project.projectName,
                    adviceNumber: advice.adviceNumber,
                    requestedAmount: apiUtils.indiaCurrencyFormat(Number(advice.requestedAmount.value)) + "Rs.  (" + apiUtils.convertINRToWord(Number(advice.requestedAmount.value)) + ")",
                };

                mail_send.mailDelivery('initiate_payment_request', locals);
                deferred.resolve({status: constants.ADVICE_STATUS.STATUS_SUCCESS});
            });
        });


        return deferred.promise;
    }
};

module.exports=sendMail;
function prepareDataForApprovedAdvice(advice, recipients){
    var deferred = Q.defer();
    var ccRecipients=JSON.parse(JSON.stringify(recipients));
    ccRecipients.splice(0, 1);
    var payeeName = (advice.payee.user.firstName+' '+advice.payee.user.middleName+' '+advice.payee.user.lastName);
    var locals = {
        toEmail:recipients[0],
        adviceNumber: advice.adviceNumber,
        payeeName:payeeName,
        projectName:advice.project.projectName,
        requestedAmount:apiUtils.indiaCurrencyFormat(Number(advice.requestedAmount))+"Rs.  ("+apiUtils.convertINRToWord(Number(advice.requestedAmount))+")",
        cc: ccRecipients
    };

    if(advice.adviceStatus === constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER){
        locals.fullName = constants.ADVICE_DISPLAY_ROLES.ROLE_LEVEL3APPROVER;
        locals.approval = advice.secondLevelApprover.firstName+" "+advice.secondLevelApprover.lastName;
        locals.textTemplate = 'Following advice has been approved by';
        locals.subject = "iPASS advice approve by Level 2 Approval"
        getProjectNotificationMail(advice.project._id).then(function(projectNotificationMail){
            ccRecipients=ccRecipients.concat(projectNotificationMail);
            locals.cc=ccRecipients;
            deferred.resolve(locals);
        })
    }
    else  if(advice.adviceStatus===constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER){
        locals.fullName = constants.ADVICE_DISPLAY_ROLES.ROLE_DISBURSER;
        locals.approval = advice.thirdLevelApprover.firstName+" "+advice.thirdLevelApprover.lastName;
        locals.textTemplate = 'Following advice has been approved by';
        locals.subject = "iPASS advice approve by Level 3 Approval";

        getProjectNotificationMail(advice.project._id).then(function(projectNotificationMail){
            ccRecipients=ccRecipients.concat(projectNotificationMail);
            locals.cc=ccRecipients;
            deferred.resolve(locals);
        })
    }
    else {
        locals.fullName = constants.ADVICE_DISPLAY_ROLES.ROLE_LEVEL2APPROVER;
        locals.approval = advice.initiatedBy;
        locals.textTemplate = 'Following advice has been created by';
        locals.subject = "iPASS advice created";

        getProjectNotificationMail(advice.project._id).then(function(projectNotificationMail){
            updateRecipientsWithNotification(ccRecipients).then(function(response){
                ccRecipients=projectNotificationMail.concat(response);
                locals.cc=ccRecipients;
                deferred.resolve(locals);
            });
        });
    }
    return deferred.promise;
}

/**
 *
 * @param advice
 * @param recipients
 * @returns {*}
 */

function prepareDataForRejectedAdvice(advice, recipients){
    var deferred = Q.defer();
    var ccRecipients=JSON.parse(JSON.stringify(recipients));
    ccRecipients.splice(0, 1);
    var payeeName = (advice.payee.user.firstName+' '+advice.payee.user.middleName+' '+advice.payee.user.lastName);

    var locals = {
        toEmail:recipients[0],
        adviceNumber: advice.adviceNumber,
        payeeName:payeeName,
        projectName:advice.project.projectName,
        requestedAmount:apiUtils.indiaCurrencyFormat(Number(advice.requestedAmount))+"Rs.  ("+apiUtils.convertINRToWord(Number(advice.requestedAmount))+")",
        cc: ccRecipients
    };

    if(advice.adviceStatus === constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER){
        locals.fullName = constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_INITIATOR_ROLE;
        locals.rejector = advice.secondLevelApprover.firstName+" "+advice.secondLevelApprover.lastName;
        locals.textTemplate = 'Following advice has been rejected by';
        locals.subject = "iPASS advice rejected by Level 2 Approval"
    }
    else  if(advice.adviceStatus === constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER){
        locals.fullName = constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER;
        locals.rejector = advice.thirdLevelApprover.firstName+" "+advice.thirdLevelApprover.lastName;
        locals.textTemplate = 'Following advice has been rejected by';
        locals.subject = "iPASS advice rejected by Level 3 Approval"
    }
    else {
        locals.fullName = constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER;
        locals.rejector = advice.disburser.firstName+" "+advice.disburser.lastName;
        locals.textTemplate = 'Following advice has been rejected by';
        locals.subject = "iPASS advice rejected";

    }

    deferred.resolve(locals);
    return deferred.promise;
}

function updateRecipientsWithNotification(ccRecipients){
    var deferred = Q.defer();
    manageNotificationModele.findOne({type : "create"},function(err,data){
        if(err){
            console.log(err)
        }else if(data===null || data===undefined) {
            deferred.resolve(ccRecipients);
        }
        else{
            if(data.is_email=== true){
                notificationModel.find({type : "email"},function(err,dataCreate){
                    if(err){
                        console.log("error"+err);
                    }else if(dataCreate===null || dataCreate===undefined) {
                    }
                    else{
                        dataCreate.forEach(function(emailData){
                            ccRecipients.push(emailData.contact);
                        });
                        deferred.resolve(ccRecipients);
                    }
                });
            }
            else if(data.is_email=== false){
                deferred.resolve(ccRecipients);
            }
            else {
                deferred.reject("empty array");
            }
        }
    });
    return deferred.promise;
}

function prepareLocalForPaymentReqOperations(advice,subject) {
    var deferred = Q.defer();
    apiUtils.getUserById(advice.paymentRequestId.requestedUser).then(function (user) {
        var fullName = apiUtils.prepareFullName(user);
        var payeeName = apiUtils.prepareFullName(advice.payee.user);

        var locals = {
            toEmail: user.email,
            fullName: fullName,
            adviceNumber: advice.adviceNumber,
            payeeName: payeeName,
            projectName: advice.project.projectName,
            approvalStatus: advice.adviceStatus,
            requestedAmount: apiUtils.indiaCurrencyFormat(Number(advice.requestedAmount)) + "Rs.  (" + apiUtils.convertINRToWord(Number(advice.requestedAmount)) + ")",
            subject: subject
        };


        if(subject === constants.PAYMENT_REQUEST_SUBJECT.APPROVED){
            if (advice.adviceStatus === constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER) {
                locals.approvalName = apiUtils.prepareFullName(advice.secondLevelApprover)
            }
            if (advice.adviceStatus === constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER) {
                locals.approvalName = apiUtils.prepareFullName(advice.thirdLevelApprover)
            }
        }

        if(subject === constants.PAYMENT_REQUEST_SUBJECT.REJETED){
            if(advice.adviceStatus === constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER){
                locals.approvalName=apiUtils.prepareFullName(advice.secondLevelApprover)
            }if(advice.adviceStatus === constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER){
                locals.approvalName=apiUtils.prepareFullName(advice.thirdLevelApprover)
            }if(advice.adviceStatus === constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_DISBURSER){
                locals.approvalName=apiUtils.prepareFullName(advice.disburser)
            }
        }

        if(subject === constants.PAYMENT_REQUEST_SUBJECT.DISBURESD){
            if(advice.adviceStatus === constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_DISBURSER){
                locals.disburserName=apiUtils.prepareFullName(advice.disburser);
                locals.disburseDate=apiUtils.getConvertedDate(new Date);
                locals.disburserStatus=advice.adviceStatus
            }
        }

        deferred.resolve(locals);
    });
    return deferred.promise;
}

/**
 *
 * @param id
 * @returns {*|promise}
 *
 * Method will return array of email associate to particular project
 */
function getProjectNotificationMail(id){
    var deferred = Q.defer();


    var projectEmails=[];
    projectModel.findOne({_id:id},{'contacts':1})
        .populate({path:'contacts',select: 'contact type'})
        .exec(function(err,projectdata){
            if(err){
                console.log("Error :",err)
            }
            else if(!projectdata.contacts){
                deferred.resolve(projectEmails);
            }
            else {
                projectdata.contacts.forEach(function(projectEamil){
                    if(projectEamil.type === 'email'){
                        projectEmails.push(projectEamil.contact);
                    }
                });
                deferred.resolve(projectEmails);
            }
        });

    return deferred.promise;
}