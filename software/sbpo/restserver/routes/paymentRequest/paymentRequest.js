var commentModel = require('../../models/CommentModel');
var AdviceModel= require('../../models/AdviceModel');
var paymentRequestModel = require('../../models/PaymentRequestModel');
var paymentRequesterModel = require('../../models/PaymentRequester');
var ProjectModel = require('../../models/ProjectModel');
var passwordHash = require('password-hash');
var ErrorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var mongoose = require('mongoose');
var status = require('../../enums/status');
var mailService=require('../Mail/mailService');
var adviceUtil= require('../../utils/adviceUtils');
var paymentRequestUtil= require('../../utils/paymentRequestUtils');
var Q = require('q');
var constants = require('../../utils/constants');
var excelGenerator = require('../../utils/excelGenerator');
var apiUtils= require('../../utils/apiUtils');
const fs = require('fs');
const os = require('os');
var tmp=os.tmpdir()+'/';


var paymentRequest = {
    listByStatus: function (req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        if (queryParam.groupByCriteria === constants.GROUP_TYPE.PROJECT) {
            var query = {organization: mongoose.Types.ObjectId(req.currentUser.organization)};
            if(queryParam.projectId){
                query.project = mongoose.Types.ObjectId(queryParam.projectId);
                query.requestedUser = mongoose.Types.ObjectId(req.currentUser._id);
            }
            query.status = queryParam.status;
            var aggregateQuery = [
                {$match: query},
                {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
                {$unwind: "$project"},
                {
                    $group: {
                        paymentRequestCount: {$sum: 1},
                        requestedAmount: {$sum: "$amount"},
                        _id: "$project._id",
                        project: {$first: "$project"}
                    }
                },
                {"$project": {project: 1, paymentRequestCount: 1, requestedAmount: 1}}/*,
                 {"$sort": {"createdDate": queryParam.sortCriteria}}*/
            ];
            var paymentRequestsObject={}
            if(queryParam.projectSkip || queryParam.projectLimit) {
                paymentRequestUtil.getTotalProjectCount(aggregateQuery).then(function (response) {
                    paymentRequestsObject.totalProjectCount = response;

                });
                aggregateQuery = aggregateQuery.concat([{"$skip": queryParam.projectSkip}, {"$limit": queryParam.projectLimit}])
            }
            paymentRequestModel.aggregate(aggregateQuery, function (err, paymentRequests) {
                if (paymentRequests) {
                    paymentRequestsObject.paymentRequests=paymentRequests
                    res.send(new SuccessResponse('OK', paymentRequestsObject, "", "success"));
                }
                if (err) {
                    res.send(new ErrorResult('FAILED', 'Payment Requests not found'));

                }
            })

        } else {
            var query;
            if (queryParam.projectId) {
                query = {
                    'project': mongoose.Types.ObjectId(queryParam.projectId),
                    'organization': req.currentUser.organization,
                    'status' : queryParam.status
                };
            }
            if(req.currentUser.roles.indexOf(constants.PAYMENT_REQUEST_ROLES.ROLE_PAYMENT_REQUESTER)!==-1){
                query.requestedUser=req.currentUser._id;
            }

            var sort = {};
            if (queryParam.sortCriteria) {
                sort.createdDate = queryParam.sortCriteria;
            }
            var populate = [{
                path: 'payee', select: 'nickName user',
                populate: {path: 'user', select: 'firstName middleName lastName'}
            }, {path: 'project'}, {path: 'requestedUser'}, {path: 'paymentType'}, {
                path: 'comments',
                populate: {path: 'user'}
            }];
            paymentRequestModel.find(query)
                .sort(sort)
                .populate(populate).skip(queryParam.adviceSkip).limit(queryParam.adviceLimit)
                .exec(function (err, paymentRequest) {
                    if (paymentRequest) {
                        res.send(new SuccessResponse('OK', paymentRequest, "", "success"));
                    }
                    if (err) {
                        res.send(new ErrorResult('FAILED', 'Payment Requests not find'));
                    }
                });
        }
    },
    getPaymentRequestCount: function (req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var paymentReqCount={
            submittedPaymentReqCount:0,
            approvedPaymentReqCount:0,
            rejectedPaymentReqCount:0,
            totalPaymentReqCount:0
        };
        var promises = [];

        promises.push(paymentRequestModel.count(paymentRequestUtil.getPaymentRequestStatus(constants.PAYMENT_REQUEST_STATUS.SUBMITTED, req.currentUser, queryParam)));
        promises.push(paymentRequestModel.count(paymentRequestUtil.getPaymentRequestStatus(constants.PAYMENT_REQUEST_STATUS.APPROVED, req.currentUser,queryParam)));
        promises.push(paymentRequestModel.count(paymentRequestUtil.getPaymentRequestStatus(constants.PAYMENT_REQUEST_STATUS.REJECTED, req.currentUser,queryParam)));
        promises.push(paymentRequestModel.count(paymentRequestUtil.getPaymentRequestStatus('ALL', req.currentUser)));
        Q.allSettled( promises ).then(function (resp) {
            paymentReqCount.submittedPaymentReqCount = resp[0].value;
            paymentReqCount.approvedPaymentReqCount = resp[1].value;
            paymentReqCount.rejectedPaymentReqCount = resp[2].value;
            paymentReqCount.totalPaymentReqCount = resp[3].value;
            res.send( new SuccessResponse(200, paymentReqCount, apiUtils.i18n('request.success.msg')) );
        });
    },
    getPaymentRequestById: function (req, res) {
        if (req.params.id) {
            var populate = [{
                path: 'payee', select: 'user nickName',
                populate: {path: 'user', select: 'firstName middleName lastName'}
            }, {path: 'project'}, {path: 'requestedUser'}, {path: 'paymentType'}, {
                path: 'comments',
                populate: {path: 'user'}
            }];
            paymentRequestModel.findById(req.params.id)
                .populate(populate)
                .exec(function (err, paymentRequest) {
                    if (err) {
                        res.send(new ErrorResult(404, 'Payment Requests not found'));
                    }
                    else {
                        AdviceModel.findOne({paymentRequestId: req.params.id},{adviceNumber:1,_id:0}).exec(function(err1,Advice){
                            if(err1){
                                res.send(new ErrorResult(404, 'Advice Number not found'));
                            }
                            else if(Advice != null){
                                paymentRequest = Object.assign({}, paymentRequest)
                                paymentRequest = paymentRequest._doc
                                paymentRequest.adviceNumber = Advice.adviceNumber
                            }
                            res.send(new SuccessResponse(200, paymentRequest, "", "success"));

                        });
                    }
                });
        }
        else {
            res.send(new ErrorResult('FAILED', 'Payment Requests id is missing'));
        }
    },
    create: function (req, res) { //creates new payment requests
        var queryParams = req.body.q;
        var paymentRequestObj = {
            organization: mongoose.Types.ObjectId(req.currentUser.organization),
            payee: mongoose.Types.ObjectId(queryParams.payee._id),
            project: mongoose.Types.ObjectId(queryParams.project._id),
            paymentType: mongoose.Types.ObjectId(queryParams.paymentType.key),
            requestedUser: mongoose.Types.ObjectId(req.currentUser._id),
            amount: queryParams['requestedAmount'],
            purpose: queryParams['purpose'] ? queryParams['purpose'] : "",
            status: status.SUBMITTED.code
        };
        var paymentRequest;
        if (queryParams.comment) {
            var commentObject = {
                text: queryParams.comment,
                user: queryParams.user,
                organization: mongoose.Types.ObjectId(req.currentUser.organization)
            };
            var comment = new commentModel(commentObject);
            comment.save(function (err, commentData) {
                if (commentData) {
                    paymentRequestObj.comments = commentData._id;
                    paymentRequest = new paymentRequestModel(paymentRequestObj);
                    createPaymentRequest(queryParams, paymentRequest, req).then(function (paymentRequestInstance) {
                        return res.json(new SuccessResponse(200, paymentRequestInstance, {}, "Payment request saved successfully"));
                    }).catch(function (paymentError) {
                        return res.json(new ErrorResult(500, paymentError, ["Error occurred while saving payment request"]))
                    })
                }
                else {
                    return res.json(new ErrorResult(500, paymentError, ["Error occurred while saving payment request"]))
                }
            })
        }
        else {
            paymentRequest = new paymentRequestModel(paymentRequestObj);
            createPaymentRequest(queryParams, paymentRequest, req).then(function (paymentRequestInstance) {
                return res.json(new SuccessResponse(200, paymentRequestInstance, {}, "Payment request saved successfully"));
            }).catch(function (paymentError) {
                return res.json(new ErrorResult(500, paymentError, ["Error occurred while saving payment request"]))
            })
        }

    },
    delete: function (req, res) { //deletes payment requests
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        if (req.currentUser) {
            var user = req.currentUser;
            var passCodeMatched = paymentRequest.validate(user, queryParam.passCode);
            if (passCodeMatched) {
                paymentRequestModel.findById(queryParam.id, function (error, paymentRequest) {
                    if (error) {
                        return res.json(new ErrorResult(404, "Payment request not found", ["Payment request not found"]))
                    }
                    else {
                        if (paymentRequest.status === constants.PAYMENT_REQUEST_STATUS.REJECTED ||
                            paymentRequest.status === constants.PAYMENT_REQUEST_STATUS.APPROVED ||
                            paymentRequest.status === constants.PAYMENT_REQUEST_STATUS.SUBMITTED
                        ) {
                            paymentRequest.remove(queryParam.id, function (err, pr) {
                                if (err) {
                                    return res.json(new ErrorResult(404, "Error occurred while deleting payment request",
                                        ["Error occurred while deleting payment request"]))
                                }
                                return res.json(new SuccessResponse(200, {}, {}, "Payment request deleted successfully"));
                            })
                        }
                        else {
                            return res.json(new ErrorResult(500, "Permission Denied"));
                        }
                    }
                });

            } else {
                return res.send(new ErrorResult(304, apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
        else {
            res.send(new ErrorResult('FAILED', 'Auth-token is not found in request'))
        }
    },
    deletePaymentRequests: function (req, res) { //deletes payment requests
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var bulkDelete = false;
        if (req.currentUser) {
            var user = req.currentUser;
            var passCodeMatched = paymentRequest.validate(user, queryParam.passCode);
            if (passCodeMatched) {

                if (req.currentUser.roles.indexOf(constants.ADVICE_ROLE.ROLE_INITIATOR) !== -1) {//If user has initiator role
                    paymentRequestModel.remove({_id: {$in: queryParam.ids}},
                        function (error, result) {
                            if (error) {
                                return res.json(new ErrorResult(500, apiUtils.i18n('payment.requests.delete.error.msg'), [error]))
                            }
                            else {
                                return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('payment.requests.delete.success.msg')));
                            }
                        });
                }
                else {
                    return res.json(new ErrorResult(550, apiUtils.i18n('payment.requests.delete.permission.error.msg'), [error]))
                }
            } else {
                return res.send(new ErrorResult(304, apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
        else {
            res.send(new ErrorResult(500, apiUtils.i18n('user.auth.token.error.msg')))
        }
    },
    reject: function (req, res) {
        var queryParam = req.body.q;

        if (queryParam.comment) {
            var commentObject = {
                text: queryParam.comment,
                user: queryParam.user,
                organization: mongoose.Types.ObjectId(req.currentUser.organization)
            };
            var comment = new commentModel(commentObject);
            comment.save(function (err, commentData) {
                if (commentData) {
                    var user = req.currentUser;
                    var passCodeMatched = paymentRequest.validate(user, queryParam.passcode);
                    if (passCodeMatched) {
                        paymentRequestModel.findByIdAndUpdate({_id: queryParam.id},
                            {
                                status: status.REJECTED.code,
                                updatedBy: mongoose.Types.ObjectId(user._id)
                            },
                            {new: true}, function (error, paymentRequest) {
                                if (error) {
                                    return res.json(new ErrorResult(404, "Payment request not found", ["Payment request not found"]))
                                }
                                paymentRequestModel.findOne({_id: paymentRequest._id})
                                    .populate("requestedUser")
                                    .populate("project")
                                    .populate("payee").exec(function (err, rejectedPaymentRequest) {
                                    if (err) {
                                        res.send(err);
                                    } else {
                                        if (rejectedPaymentRequest.comments) {
                                            rejectedPaymentRequest.comments.push(commentData._id);
                                        }
                                        else {
                                            rejectedPaymentRequest['comments'] = [commentData._id];
                                        }
                                        paymentRequestModel.update({_id: paymentRequest._id},rejectedPaymentRequest,function (err, paymetData) {
                                            if (paymetData) {
                                                mailService.sendMailOnRejectPaymentRequest(rejectedPaymentRequest).then(function (response) {
                                                    return res.json(new SuccessResponse(200, paymentRequest, {}, "Payment request rejected successfully"));
                                                })
                                            }
                                            else {
                                                return res.json(new ErrorResult(304, "Passcode not matching"))
                                            }
                                        });

                                    }
                                });
                            });
                    }
                    else {
                        return res.json(new ErrorResult(304, "Passcode not matching"))
                    }


                }
                else {
                    return res.json(new ErrorResult(402, "Passcode not matching"))
                }

            })
        }

        else {
            return res.json(new ErrorResult(402, "Comment field is mandatory"));
        }

    },
    approve: function (req, res) {
        paymentRequestModel.findByIdAndUpdate(req.body.q,
            {
                status: status.APPROVED.code,
                updatedBy: mongoose.Types.ObjectId(req.currentUser._id)
            }, {new: true}, function (error, paymentRequest) {

                if (error) {
                    return res.json(new ErrorResult(404, "Payment request not found", ["Payment request not found"]))
                }
                else {
                    paymentRequestModel.findOne({_id: paymentRequest._id})
                        .populate("requestedUser")
                        .populate("project")
                        .populate("payee").exec(function (err, approvedPaymentRequest) {
                        if (err) {
                            res.send(err);
                        } else {
                            return res.json(new SuccessResponse(200, paymentRequest, {}, "Payment request approved successfully"));
                            /* console.log("approvedPaymentRequest",approvedPaymentRequest);
                             mailService.sendMailOnInitiatePaymentRequest(approvedPaymentRequest).then(function(response){
                             return res.json(new SuccessResponse(200, paymentRequest, {}, "Payment request approved successfully"));
                             })*/
                        }
                    });
                }

            });
    },
    validatePaymentRequest: function (req, res, next) { //validates payment request form data
        req.check('q.payee', 'Payee is required.').notEmpty();
        req.check('q.project', 'Project is required.').notEmpty();
        req.check('q.requestedAmount', 'Amount is required.').notEmpty();
        req.check('q.paymentType', 'Payment type is required.').notEmpty();
        paymentRequest.proceedReq(req, res, next);
    },
    proceedReq: function (req, res, next) {
        var errors = req.validationErrors();
        if (errors) {
            return res.status(400).send(errors);
        } else {
            next()
        }
    },
    downloadPaymentRequest:function(req,res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        console.log("queryParam.type")
        console.log(queryParam.type)
        console.log("queryParam.type")
        if (queryParam.type === "project-excel") {
            var query = adviceUtil.prepareAggregationQueryForPaymentRequest(req,queryParam);
            var fileName = "Payment_Requests" + new Date().getTime();
            paymentRequestModel.aggregate(query, function (err, data) {
                if (err) {
                    console.log("Error", err);
                }
                else {
                    var paymentReqStatus = {};
                    data.forEach(function (paymentRequests) {
                        paymentReqStatus[paymentRequests._id.project._id] = { SUBMITTED:[], APPROVED:[], REJECTED:[],total:paymentRequests.total};
                        paymentRequests.projectDetails.forEach(function (result){

                            if(result.status === constants.PAYMENT_REQUEST_STATUS.SUBMITTED) {
                                paymentReqStatus[paymentRequests._id.project._id].SUBMITTED.push(result);
                            }
                            else if(result.status === constants.PAYMENT_REQUEST_STATUS.APPROVED) {
                                paymentReqStatus[paymentRequests._id.project._id].APPROVED.push(result);
                            }
                            else if(result.status === constants.PAYMENT_REQUEST_STATUS.REJECTED){
                                paymentReqStatus[paymentRequests._id.project._id].REJECTED.push(result);
                            }
                        })
                    });

                    excelGenerator.generateExcelBookPerProjectForPaymentRequest(paymentReqStatus, fileName, queryParam).then(function (response) {
                        var filenameexl = tmp + fileName;
                        var xls = fs.readFileSync(filenameexl);
                        res.writeHead(200, {
                            'Content-Type': 'application/vnd.ms-excel',
                            "Content-Disposition": "attachment; filename=" + "iPASS_Payment_Requests_" + new Date().getTime() + ".xlsx"
                        });
                        res.end(xls, 'binary');
                    }).catch(function(error) {
                        console.log(">>>>>>>error>>>>>>>>>")
                        console.log(error);
                        console.log(">>>>>>>>error>>>>>>>>");
                    });
                }
            })
        }
        else {
            var query = adviceUtil.prepareAggregationQueryForPaymentRequestByStatus(req,queryParam);
            var fileName = "Payment_Requests" + new Date().getTime();
            paymentRequestModel.aggregate(query, function (err, data) {
                if (err) {
                    console.log("Error", err);
                }
                else {
                    excelGenerator.generateExcelBookForPaymentRequests(data, fileName, queryParam).then(function (response) {
                        var filenameexl = tmp + fileName;
                        var xls = fs.readFileSync(filenameexl);
                        res.writeHead(200, {
                            'Content-Type': 'application/vnd.ms-excel',
                            "Content-Disposition": "attachment; filename=" + "iPASS_Payment_Requests_" + new Date().getTime() + ".xlsx"
                        });
                        res.end(xls, 'binary');
                    }).catch(function(error) {
                        console.log(">>>>>>>error>>>>>>>>>")
                        console.log(error);
                        console.log(">>>>>>>>error>>>>>>>>");
                    });
                }
            });
        }
    },
    validate: function (user, password) {
        return passwordHash.verify(password, user.passcode);
    },
    getCommentsByPaymentRequest: function (req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var query = {'_id': queryParam.paymentRequestId, 'organization': req.currentUser.organization};
        paymentRequestModel
            .findOne(query)
            .populate({
                path: 'comments',
                populate: {path: 'user', select: 'firstName middleName lastName'},
                options: {sort: {'createdDate': -1}}
            })
            .exec(function (error, paymentRequest) {
                if (error) {
                    res.send(error);
                }
                else {
                    res.send(new SuccessResponse('OK', paymentRequest.comments, "", "success"));
                    res.end();
                }
            });
    },
    getProjectsOfPaymentRequests: function (req, res) {
        var populate={path:'assignedProject',select:'projectName'};
        paymentRequesterModel.findOne({user: req.currentUser._id}).populate(populate).exec(function(err,paymentRequester){
            paymentRequestModel.find({"requestedUser": req.currentUser._id}, {project:1, _id:-1}, function (err, projectIds) {
                if(projectIds && projectIds.length > 0) {

                    projectIds = projectIds.map(function(proj){
                        return proj['project'];
                    })
                    projectIds.push(paymentRequester.assignedProject._id);
                    ProjectModel.find({"_id":{"$in":projectIds}}, {"projectName":1}, function (err, projectNames) {
                        if (err) {
                            res.send(new ErrorResult('FAILED', 'projects not found'));
                        } else {
                            res.send(new SuccessResponse('OK', projectNames, "", "success"));
                        }
                    })
                }else{
                    res.send(new ErrorResult('FAILED', 'projects not found'));
                }
            })
        })

    }
};

module.exports = paymentRequest;
/**
 *
 * @param paymentRequest
 */
function createPaymentRequest(queryParams, paymentRequest, req) {
    var defered = Q.defer();
    paymentRequest.save(function (err, paymentRequestInstance) {
        if (err) {
            defered.reject("Error occurred while saving payment request");
        }
        else {
            adviceUtil.getReceiptsByStatus(constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_INITIATOR_ROLE, req.currentUser.organization).then(function (recipients) {
                mailService.sendMailOnCreatePaymentRequest(paymentRequestInstance, queryParams, recipients, req.currentUser).then(function (response) {
                    defered.resolve(paymentRequestInstance)
                })
            }, function (err) {
                defered.reject("Error occurred while saving payment request");
            });
        }
    });
    return defered.promise;
}
