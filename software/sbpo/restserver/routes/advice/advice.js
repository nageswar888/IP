var AdviceModel= require('../../models/AdviceModel');
var UserModel= require('../../models/UserModel');
var PaymentRequestModel= require('../../models/PaymentRequestModel');
var CommentModel= require('../../models/CommentModel');
var passwordHash = require('password-hash');
var ErrorResult = require('../../models/ErrorResult');
var shadedResponse = require('../../utils/shadedResponse');
var SuccessResponse = require('../../models/SuccessResponse');
var Q = require('q');
const fs = require('fs');
var advicePdfGenerator = require('../../utils/advicePdfGenerator');
var adviceExcelGenerator = require('../../utils/excelGenerator');
var apiUtils= require('../../utils/apiUtils');
var searchAdviceUtils= require('../../utils/searchAdviceUtils');
var adviceUtil= require('../../utils/adviceUtils');
var mailSend=require('../Mail/mailService');
var constants = require('../../utils/constants');
var mongoose = require('mongoose');
var virtualLedgerModel=require('../../models/VirtualLedgerModal');
const os = require('os');
var tmp=os.tmpdir()+'/';

var AdviceRoute;
AdviceRoute = {
    search: function (req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var getPayeesIdsOfVirtualLedger=adviceUtil.getPayeesIdsOfVirtualLedger(queryParam.virtualLedger);
        getPayeesIdsOfVirtualLedger.then(function(payees){
            if(payees.length!==0){
                queryParam.virtualLedgerPayees=payees
            }
            searchAdviceUtils.populateSearchDataByFilters(queryParam, req.currentUser).then(function (response) {
                if(Object.keys(response).length === 0 && response.constructor === Object){
                    res.send(new SuccessResponse(200, response, "", apiUtils.i18n('request.success.msg')));
                }
                else if(Array.isArray(response.advices) && response.advices.length===0){
                    res.send(new SuccessResponse(200, {}, "", apiUtils.i18n('request.success.msg')));
                }
                else if(Array.isArray(response) && response.length===0){
                    res.send(new SuccessResponse(200, response, "", apiUtils.i18n('request.success.msg')));
                }
                else {
                    searchAdviceUtils.findTotalAmount(queryParam, req.currentUser).then(function(totalAmount){
                        if(queryParam.groupByCriteria !== 'graph') {
                            response.grandTotal=totalAmount;
                        }
                        res.send(new SuccessResponse(200, response, "", apiUtils.i18n('request.success.msg')));
                    })
                }
            }, function (err) {
                res.send(new ErrorResult(404, err));
            });
        },function(rejected){
            res.send(new ErrorResult(404, rejected));
        })
    },
    searchByDateTblTab:function(req,res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var getPayeesIdsOfVirtualLedger=adviceUtil.getPayeesIdsOfVirtualLedger(queryParam.virtualLedger);
        getPayeesIdsOfVirtualLedger.then(function(payees){
            if(payees.length!==0){
                queryParam.virtualLedgerPayees=payees
            }
            searchAdviceUtils.getAdvicesForTbleTab(queryParam, req.currentUser).then(function (response) {
                res.send(new SuccessResponse(200, response.docs, response, apiUtils.i18n('request.success.msg')));
                res.end();

                /*res.send(new SuccessResponse(200, response, "", apiUtils.i18n('request.success.msg')));*/
            }, function (err) {
                res.send(new ErrorResult(404, err));
            });
        },function(rejected){
            res.send(new ErrorResult(404, rejected));
        })
    },
    listAllAdvice: function(req,res){
        AdviceModel.find({expired: false, organization: req.currentUser.organization})
            .populate('secondLevelApprover')
            .populate('user')
            .populate('thirdLevelApprover')
            .populate('disburser')
            .populate('payee')
            .populate('project')
            .populate('bank').exec(function (err, advices) {
            if (err) {
                res.send(err);
            } else {
                res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advices))), "", apiUtils.i18n('request.success.msg')) );
                //res.send(JSON.stringify(advices));
                res.end();
            }
        });
    },
    fetchAdvicesByStatus:function(req,res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        adviceUtil.fetchAdvicesByStatusCategory(queryParam, req.currentUser).then(function(advices) {
            res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advices))), "", apiUtils.i18n('request.success.msg')) );
        }, function(err) {
            res.send(new ErrorResult('FAILED', err));
        });
    },

    getAdviceCount: function (req, res) {
        ////add organization {organization: req.currentUser.organization}
        var inprogressCount={
            inProgressAdviceCount:0,
            pendingAdviceCount:0,
            rejectedAdviceCount:0
        };
        var promises = [];
        promises.push(AdviceModel.count(adviceUtil.getAdviceStatusesQueryToDisplay({statusCategory: constants.ADVICE_STATUS_CATEGORIES.PENDING}, req.currentUser)));
        promises.push(AdviceModel.count(adviceUtil.getAdviceStatusesQueryToDisplay({statusCategory: constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS}, req.currentUser)));
        promises.push(AdviceModel.count(adviceUtil.getAdviceStatusesQueryToDisplay({statusCategory: constants.ADVICE_STATUS_CATEGORIES.REJECTED}, req.currentUser)));
        Q.allSettled( promises ).then(function (resp) {
            inprogressCount.pendingAdviceCount = resp[0].value;
            inprogressCount.inProgressAdviceCount = resp[1].value;
            inprogressCount.rejectedAdviceCount = resp[2].value;
            res.send( new SuccessResponse('OK', inprogressCount, apiUtils.i18n('request.success.msg')) );
        });
    },
    saveAdvice: function (req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        if(queryParam.status===undefined){
            queryParam.status = constants.ADVICE_STATUS_CATEGORIES.SUBMITTED;
            var updateObj = {
                adviceStatus: queryParam.status,
                rejectedBy:null
            };
            AdviceModel.update(
                { _id: queryParam._id }, updateObj,
                { upsert: true },function(err,data){
                    if(err){
                        res.send(err);
                    }
                    else {
                        AdviceModel.findOne({_id:queryParam._id},function(err,advice){
                            if(err){
                                res.send(err);
                            }
                            else{
                                adviceUtil.afterCreateAdvice(queryParam, advice, req.currentUser.organization).then(function (success) {
                                    res.send( new SuccessResponse(200, advice , "", apiUtils.i18n('request.success.msg')) );
                                }, function(err) {
                                    console.log(err);
                                });
                            }
                        });


                    }
                }
            )
        }
        else if(queryParam.status === constants.ADVICE_STATUS_CATEGORIES.DRAFT && queryParam.passCode !== undefined) {
            //Submit advice
            var saveCommentError = false;
            var newCommentId;
            var commentPromise;
            queryParam.status = constants.ADVICE_STATUS_CATEGORIES.SUBMITTED;
            var user = req.currentUser;
            updateObj = {
                adviceStatus: queryParam.status,
                rejectedBy:null
            };
            var passCodeMatched = AdviceRoute.validate(user, queryParam.passCode);
            if (passCodeMatched) {
                if (queryParam.comment) {
                    var comment = new CommentModel({
                        text: queryParam.comment,
                        user: user._id,
                        organization: req.currentUser.organization
                    });
                    commentPromise = comment.save(function (err, data) {
                        if (err) {
                            saveCommentError = true;
                            res.send(new ErrorResult(500, apiUtils.i18n('comment.save.error.msg')));
                        } else {
                            newCommentId = data._id;
                            AdviceModel.update({"_id":queryParam._id},{"$addToSet":{comments:data._id}},function(error, advice){
                                if(error) {
                                    console.log("Failed to save comment Id: "+data._id+" in advice: "+queryParam._id);
                                    return res.send(new ErrorResult(500, apiUtils.i18n('comment.save.id.in.advice.error.msg')));
                                }
                            });
                        }
                    })
                }

                Q.allSettled( [commentPromise] ).then(function (resp) {
                    adviceUtil.saveAdvice(queryParam, updateObj).then(function(success){
                        AdviceModel.findOne({_id:queryParam._id},function(err,advice){
                            if(err){
                                res.send(new ErrorResult(500, apiUtils.i18n('advice.find.error.msg')));
                            }
                            else{
                                adviceUtil.afterCreateAdvice(queryParam, advice, req.currentUser.organization).then(function (success) {
                                    res.send( new SuccessResponse(200, advice , "", apiUtils.i18n('request.success.msg')) );
                                }, function(err) {
                                    return res.send(new ErrorResult(500, apiUtils.i18n('mail.notification.error.msg'), [err]))
                                });
                            }
                        });

                    },function(err) {
                        //If comment is created remove it
                        if(!saveCommentError && newCommentId) {
                            CommentModel.remove({_id:newCommentId},
                                function(error, result) {
                                    if (error) {
                                        return res.send(new ErrorResult(500, apiUtils.i18n('comment.delete.error.msg'), [error]))
                                    }
                                    else{
                                        return res.send(new ErrorResult(500, apiUtils.i18n('advice.update.error.msg'), [err]))
                                    }
                                });
                        }
                        else {
                            return res.send(new ErrorResult(500, apiUtils.i18n('advice.update.error.msg'), [err]))
                        }
                    });

                }, function(error) {
                    res.send(new ErrorResult(500, apiUtils.i18n('error.msg') ));
                });

            } else {
                return res.send(new ErrorResult(403, apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
        else{
            adviceUtil.createNewAdvice(queryParam, req.currentUser.organization).then(function(data) {
                res.send( new SuccessResponse(200, data , "", apiUtils.i18n('request.success.msg')) );
            }, function(err) {
                res.send(new ErrorResult('FAILED', err));
            });
        }
    },
    validate: function(user, password) {
        return passwordHash.verify(password, user.passcode);
    },
    editAdvice: function(req,res){
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var saveCommentError = false;
        var newCommentId;
        var commentPromise;
        if (queryParam.comment != undefined) {
            var comment = new CommentModel({
                text: queryParam.comment,
                user: queryParam.currentUser,
                organization: req.currentUser.organization
            });
            commentPromise = comment.save(function (err, data) {
                if (err) {
                    saveCommentError = true;
                    res.send(new ErrorResult(500, apiUtils.i18n('comment.save.error.msg')));
                } else {
                    newCommentId = data._id;
                    AdviceModel.update({"_id":queryParam._id},{"$addToSet":{comments:data._id}},function(error, advice){
                        if(error) {
                            console.log("Failed to save comment Id: "+data._id+" in advice: "+queryParam._id);
                            return res.send(new ErrorResult(500, apiUtils.i18n('comment.save.id.in.advice.error.msg')));
                        }
                    });
                }
            })

        }
        Q.allSettled( [commentPromise] ).then(function (resp) {
            adviceUtil.updateAdvice(queryParam, req).then(function(advice){
                res.send( new SuccessResponse(200, advice , "", apiUtils.i18n('request.success.msg')) );
            },function(err) {
                //If comment is created remove it
                if(!saveCommentError && newCommentId) {
                    CommentModel.remove({_id:newCommentId},
                        function(error, result) {
                            if (error) {
                                return res.send(new ErrorResult(500, apiUtils.i18n('comment.delete.error.msg'), [error]))
                            }
                            else{
                                return res.send(new ErrorResult(500, apiUtils.i18n('advice.update.error.msg'), [err]))
                            }
                        });
                }else {
                    return res.send(new ErrorResult(500, apiUtils.i18n('advice.update.error.msg'), [err]))
                }
            })

        }, function(error) {
            res.send(new ErrorResult(500, apiUtils.i18n('error.msg') ));
        });

    },
    getAdvice:function(req,res){
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        /*adviceUtil.getAdviceById(req.params.id, queryParam.includeComments).then(function(advice){
         res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", "success") );
         })*/
        adviceUtil.getAdviceByIdWithRequiredFields(req.params.id, queryParam.includeComments).then(function(advice){
            res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')) );
        })
    },
    getShortAdvice:function(req,res){
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        adviceUtil.getAdviceById(req.params.id, queryParam.includeComments).then(function(advice){
            res.send( new SuccessResponse('OK', adviceUtil.getShortAdvice(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')) );
        })
    },
    approveAdvice: function(req,res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var updateQuery = {};
        if (req.currentUser) {
            var user = req.currentUser;
            var passCodeMatched = AdviceRoute.validate(user, queryParam.passCode);
            if (passCodeMatched) {
                if (queryParam.comment) {
                    var comment = new CommentModel({
                        text: queryParam.comment,
                        user: user._id,
                        organization: req.currentUser.organization
                    });
                    comment.save(function (err, data) {
                        if (err) {
                            return res.send(err);
                        } else {
                            AdviceModel.update({"_id":queryParam._id},{"$addToSet":{comments:data._id}},function(error, advice){
                                if(error) {
                                    console.log("Failed to save comment Id: "+data._id+" in advice: "+queryParam._id);
                                    return res.send(error);
                                }
                            });
                        }
                    })
                }

                updateQuery = adviceUtil.getAdviceStatusUpdateQuery(user, queryParam, true);

                //update advice
                AdviceModel.update(
                    {_id: queryParam._id}, updateQuery,
                    {upsert: true}, function (err, response) {
                        if (err) {
                            return res.send(err);
                        }
                        else {
                            adviceUtil.getAdviceByIdWithRequiredFields(queryParam._id).then(function (advice) {
                                if (advice.adviceStatus !== constants.ADVICE_STATUS_CATEGORIES.DISBURSED) {
                                    adviceUtil.getReceiptsByStatus(advice.adviceStatus,req.currentUser.organization).then(function (recipients) {
                                        mailSend.sendMailForApproval(advice, recipients).then(function (mailRes) {
                                            if (mailRes.status) {
                                                console.log("advice advice",advice);
                                                if(advice.isPaymentRequest){
                                                    mailSend.sendMailForApprovePaymentRequest(advice).then(function(paymentRequestMail){
                                                        console.log("paymentRequestMail",paymentRequestMail)
                                                        if(paymentRequestMail.status === constants.ADVICE_STATUS.STATUS_SUCCESS){
                                                            res.send(new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')));
                                                        }
                                                        else {
                                                            res.send(new ErrorResult('FAILED', apiUtils.i18n('mail.notification.error.msg')));
                                                        }
                                                    })
                                                }
                                                else {
                                                    res.send(new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')));
                                                }

                                            }
                                            else {
                                                res.send(new ErrorResult('FAILED', apiUtils.i18n('mail.notification.error.msg')));
                                            }
                                        });
                                    });
                                }
                                else {
                                    if (advice.adviceStatus === constants.ADVICE_STATUS_CATEGORIES.DISBURSED) {
                                        mailSend.disburserAdviceEmail(advice, function (callBack) {
                                            if (callBack.status === constants.ADVICE_STATUS.STATUS_SUCCESS) {
                                                console.log("advice.isPaymentRequest....: ",advice.isPaymentRequest)
                                                console.log("typeof advice.isPaymentRequest....: ",(typeof advice.isPaymentRequest))
                                                console.log("advice.paymentRequestId....: ",(advice.paymentRequestId))
                                                if(advice.isPaymentRequest && advice.paymentRequestId){
                                                    mailSend.sendMailForDisbursePaymentRequest(advice).then(function(disburseStatus){
                                                        console.log("Comming status is",disburseStatus);
                                                        if(disburseStatus.status === constants.ADVICE_STATUS.STATUS_SUCCESS){
                                                            res.send(new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')));
                                                        }
                                                        else {
                                                            res.send(new ErrorResult('FAILED', apiUtils.i18n('mail.notification.error.msg')));
                                                        }
                                                    })
                                                }
                                                else{
                                                    res.send(new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')));
                                                }

                                            }
                                            else {
                                                res.send(new ErrorResult('FAILED', apiUtils.i18n('mail.notification.error.msg')));
                                            }
                                        });
                                    }
                                    else {
                                        res.send(new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')));
                                    }
                                }

                            });
                        }
                    }
                )
            } else {
                return res.send(new ErrorResult('FAILED', apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
    },

    rejectAdvice : function(req, res) {
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var updateQuery={};
        if(req.currentUser){
            var user = req.currentUser;
            var passCodeMatched = AdviceRoute.validate(user, queryParam.passCode);
            if (passCodeMatched) {
                if(queryParam.comment){
                    if(AdviceRoute.validate(user,queryParam.passCode)){
                        var comment = new CommentModel({
                            text: queryParam.comment,
                            user: user._id,
                            organization: req.currentUser.organization
                        });
                        comment.save(function (err, data) {
                            if (err) {
                                res.send(err);
                            } else {
                                AdviceModel.update({"_id":queryParam._id},{"$addToSet":{comments:data._id}},function(error, advice){
                                    if(error) {
                                        console.log("Failed to save comment Id: "+data._id+" in advice: "+queryParam._id);
                                        return res.send(error);
                                    }
                                });
                            }
                        })
                    }

                    updateQuery = adviceUtil.getAdviceStatusUpdateQuery(user, queryParam, false);
                    //update advice
                    AdviceModel.update(
                        { _id: queryParam._id },
                        updateQuery,
                        { upsert: true },function(err,response){
                            if(err){
                                res.send(err);
                            }
                            else {
                                adviceUtil.getAdviceByIdWithRequiredFields(queryParam._id).then(function(advice){
                                    adviceUtil.getRejectAdviceReceiptsByStatus(advice.adviceStatus,req.currentUser.organization).then(function (recipients) {
                                        mailSend.sendMailForRejection(advice, recipients).then(function (mailRes) {
                                            if (mailRes.status) {
                                                if(advice.isPaymentRequest){
                                                    mailSend.sendMailForRejectPaymentRequest(advice).then(function(paymentMailStatus){
                                                        if(paymentMailStatus.status === constants.ADVICE_STATUS.STATUS_SUCCESS){
                                                            res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')) );
                                                        }
                                                        else {
                                                            res.send(new ErrorResult('FAILED', apiUtils.i18n('mail.notification.error.msg')));
                                                        }
                                                    })
                                                }
                                                else {
                                                    res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')) );
                                                }

                                            }
                                            else {
                                                res.send(new ErrorResult('FAILED', apiUtils.i18n('mail.notification.error.msg')));
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    )
                }
                else{
                    res.send(new ErrorResult('FAILED', apiUtils.i18n('comment.required.error.msg')));
                }
            } else {
                return res.send(new ErrorResult('FAILED', apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
        else {
            res.send(new ErrorResult('FAILED', apiUtils.i18n('user.auth.token.error.msg')))
        }
    },
    voidAdvice : function(req, res) {
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var updateQuery={};
        if(req.currentUser) {
            var user = req.currentUser;
            var passCodeMatched = AdviceRoute.validate(user, queryParam.passCode);
            if (passCodeMatched) {
                if(queryParam.comment){
                    new CommentModel({
                        text: queryParam.comment,
                        user: user._id,
                        organization: req.currentUser.organization
                    }).save(function (err, data) {
                        if (err) { res.send(err); }
                        else {
                            updateQuery = {$set:{adviceStatus: constants.ADVICE_STATUS_CATEGORIES.VOID, voidedBy :user._id, isActive:false, expired:true},
                                "$addToSet":{comments:data._id}};
                            AdviceModel.update({ _id: queryParam._id }, updateQuery,function(err, response){
                                    if(err){
                                        res.send(err);
                                    } else {
                                        res.send( new SuccessResponse('OK', {}, "", apiUtils.i18n('request.success.msg')) );
                                    }
                                }
                            )

                        }
                    });
                } else {
                    res.send(new ErrorResult('FAILED', apiUtils.i18n('comment.required.error.msg')));
                }
            } else {
                return res.send(new ErrorResult('FAILED', apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
        else {
            res.send(new ErrorResult('FAILED', apiUtils.i18n('user.auth.token.error.msg')))
        }
    },
    downloadAdvicePdf: function(req, res) {

        advicePdfGenerator.generatePdf(req.params.id,req.currentUser.roles).then(function(response){
            //setTimeout(function() {
            var fileName = tmp+req.params.id+'.pdf';
            var pdf = fs.readFileSync(fileName);
            res.writeHead(200, {'Content-Type': 'application/pdf' });
            res.end(pdf, 'binary');
            //})
        });
    },
    summarizedResult:function(req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var query = apiUtils.prepareSearchQuery(queryParam, req.currentUser.organization);
        query["expired"] = false;
        if (apiUtils.isEmptyObject(query)) {
            res.json({data:"empty"})
        }
        else {
            searchAdviceUtils.advicesSummarizedResult(query).then(function(response){
                res.send( new SuccessResponse('OK', response, "", apiUtils.i18n('request.success.msg')) );
            })
        }
    },
    downloadAll:function(req, res) {
        var n1=new Date();

        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var authToken = req.headers['auth-token'] ? req.headers['auth-token']: req.query['auth-token'];
        var advicesList = [], amount = 0;
        var aggregateQuery;
        var totalAmountQuery;
        var signitureAndLogosQuery;
        var getPayeesIdsOfVirtualLedger=adviceUtil.getPayeesIdsOfVirtualLedger(queryParam.virtualLedger);
        getPayeesIdsOfVirtualLedger.then(function(payees){
            if(payees.length!==0){
                queryParam.virtualLedgerPayees=payees
            }


            //If Status is not Inprogress or Inpending
            if(queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
                && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
                && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {

                signitureAndLogos=adviceUtil.signitureAndLogosQuery(req.currentUser.organization);
                aggregateQuery = adviceUtil.downloadAllSearchQuery(queryParam, req.currentUser.organization);
                totalAmountQuery=adviceUtil.totalAmountQuery(queryParam, req.currentUser.organization);
            }
            else {
                var adviceStatusesQuery = adviceUtil.getAdviceStatusesQueryToDisplay({statusCategory: queryParam.status}, req.currentUser);
                adviceStatusesQuery.status=queryParam.status;
                aggregateQuery = adviceUtil.downloadAllByStatusQuery(adviceStatusesQuery);
                totalAmountQuery=adviceUtil.totalAmountInPendingInProgress(adviceStatusesQuery);
            }
            if (apiUtils.isEmptyObject(aggregateQuery)) {
                res.json({data:"empty"});
            }
            else {
                AdviceModel.aggregate(totalAmountQuery,function(error,totalAmount){
                    if(totalAmount[0].total){

                        AdviceModel.aggregate(aggregateQuery).allowDiskUse(true).exec(function(err,allAdvices){
                            if(allAdvices) {
                                var generatedFileName;
                                if(queryParam.fromDate && queryParam.toDate){
                                    generatedFileName="AdviceReport("+queryParam.fromDate+" to "+queryParam.toDate+").xlsx";
                                }else {
                                    generatedFileName="AdviceReport("+new Date().getTime()+").xlsx";
                                }
                                var fileName = queryParam.type === constants.DOWNLOAD_FILE_TYPE.EXCEL ? apiUtils.generateUniqueFilenameForXls(authToken) :
                                    apiUtils.generateUniqueFilename(authToken);
                                if (queryParam.type === constants.DOWNLOAD_FILE_TYPE.EXCEL) {

                                    adviceExcelGenerator.generateExcelBook(allAdvices, fileName, queryParam, totalAmount[0].total).then(function (response) {
                                        var filenameexl = tmp + fileName;
                                        var xls = fs.readFileSync(filenameexl);
                                        res.writeHead(200, {
                                            'Content-Type': 'application/vnd.ms-excel',
                                            "Content-Disposition": "attachment; filename=" + generatedFileName
                                        });
                                        res.end(xls, 'binary');
                                    });
                                } else {
                                    if(queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
                                        && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
                                        && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()){

                                        UserModel.find(signitureAndLogosQuery,{_id:1,signature:1},function(err,usersData){
                                            var sigmap={};
                                            usersData.forEach(function(eachUser,userIndex) {
                                                sigmap[eachUser._id] = eachUser.signature;
                                            });
                                            adviceUtil.getOrganizationStamps(req.currentUser.organization).then(function(stamps){
                                                advicePdfGenerator.generatePdfBook(allAdvices, fileName, queryParam, totalAmount[0].total,req.currentUser.roles,sigmap,stamps).then(function (response) {
                                                    var filenamepdf = tmp + fileName;
                                                    var pdf = fs.readFileSync(filenamepdf);
                                                    res.writeHead(200, {'Content-Type': 'application/pdf'});
                                                    res.end(pdf, 'binary');
                                                });
                                            })
                                        })
                                    }
                                    else {
                                        advicePdfGenerator.generatePdfBook(allAdvices, fileName, queryParam, totalAmount[0].total,req.currentUser.roles).then(function (response) {
                                            var filenamepdf = tmp + fileName;
                                            var pdf = fs.readFileSync(filenamepdf);
                                            res.writeHead(200, {'Content-Type': 'application/pdf'});
                                            res.end(pdf, 'binary');
                                        });
                                    }
                                }
                            }
                            else {
                                console.log("Error aggregateQuery main",err);
                                res.send(new ErrorResult(404, apiUtils.i18n('advice.not.found.error.msg')));
                            }
                        });
                    }

                    if(error){
                        res.send(new ErrorResult(404, apiUtils.i18n('error.msg')));
                    }
                });
            }
            var n2=new Date();
            console.log("Total Time",n2-n1);
        }),
            function(rejected){
                res.send(new ErrorResult(404, rejected));
            }
    },downloadProjectMatrix:function(req, res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var authToken = req.headers['auth-token'] ? req.headers['auth-token']: req.query['auth-token'];
        var query;

        query = adviceUtil.prepareAggregationQueryForProjectMatrix(queryParam, req.currentUser.organization);
        var fileName = apiUtils.generateUniqueFilenameForXls(authToken);

        if (apiUtils.isEmptyObject(query)) {
            res.json({data:"empty"})
        }
        else {
            AdviceModel.aggregate(query,function(error,result){
                if(result){
                    var proDetails = {};
                    result.forEach(function(data){
                        //data._id.year
                        if(!proDetails[new Date(data.details[0].disburseDate).getFullYear()]){
                            proDetails[new Date(data.details[0].disburseDate).getFullYear()]=[];
                        }
                        proDetails[new Date(data.details[0].disburseDate).getFullYear()].push({
                            year:new Date(data.details[0].disburseDate).getFullYear(),
                            month:new Date(data.details[0].disburseDate).getMonth(),
                            project:data.details[0].projectName,
                            totalAmt:data.totalAmt
                        });
                    });

                    adviceExcelGenerator.generateExcelPerformanceMatrix(proDetails,fileName).then(function (response) {
                        var fileNameExl = tmp + fileName;
                        var xls = fs.readFileSync(fileNameExl);
                        res.writeHead(200, {
                            'Content-Type': 'application/vnd.ms-excel',
                            "Content-Disposition": "attachment; filename=" + "iPASS_Project_wise_advices_"+new Date().getTime()+".xlsx"
                        });
                        res.end(xls, 'binary');
                    });
                }
                else {
                    res.send(new ErrorResult(404,apiUtils.i18n('advice.not.found.error.msg')));
                }
                if(error){
                    res.send(new ErrorResult(404,apiUtils.i18n('advice.not.found.error.msg')));
                }
            });
        }
    },
    downloadAllPerProject:function(req,res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var authToken = req.headers['auth-token'] ? req.headers['auth-token'] : req.query['auth-token'];
        var query;
        var totalAmountQuery;
        var signitureAndLogosQuery;
        var getPayeesIdsOfVirtualLedger=adviceUtil.getPayeesIdsOfVirtualLedger(queryParam.virtualLedger);
        getPayeesIdsOfVirtualLedger.then(function(payees){
                if(payees.length!==0){
                    queryParam.virtualLedgerPayees=payees
                }

                if (queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
                    && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
                    && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {

                    query = adviceUtil.prepareAggregationSearchQueryForPerProject(queryParam, req.currentUser.organization, true);
                    totalAmountQuery = adviceUtil.totalAmountQueryPerProject(queryParam, req.currentUser.organization, true);
                }
                else {
                    var adviceStatusesQuery = adviceUtil.getAdviceStatusesQueryToDisplay({statusCategory: queryParam.status}, req.currentUser);
                    adviceStatusesQuery.status = queryParam.status;
                    query = adviceUtil.prepareAggregationSearchQueryForPerProject(adviceStatusesQuery, req.currentUser.organization, false);
                    totalAmountQuery = adviceUtil.totalAmountQueryPerProject(adviceStatusesQuery, req.currentUser.organization, false);
                }

                var fileName = queryParam.statusType === constants.DOWNLOAD_FILE_TYPE.ALL_EXCEL ? apiUtils.generateUniqueFilenameForXls(authToken) :
                    apiUtils.generateUniqueFilename(authToken);

                if (apiUtils.isEmptyObject(query)) {
                    res.json({data: "empty"})
                }
                else {
                    AdviceModel.aggregate(totalAmountQuery, function (error, totalAmount) {
                        if (totalAmount) {
                            AdviceModel.aggregate(query, function (error, result) {
                                if (result) {
                                    if (queryParam.statusType === constants.DOWNLOAD_FILE_TYPE.ALL_EXCEL || queryParam.type === constants.DOWNLOAD_FILE_TYPE.ALL_EXCEL) {
                                        adviceExcelGenerator.generateExcelBookPerProject(result, fileName, queryParam).then(function (response) {
                                            var filenameexl = tmp + fileName;
                                            var xls = fs.readFileSync(filenameexl);
                                            res.writeHead(200, {
                                                'Content-Type': 'application/vnd.ms-excel',
                                                "Content-Disposition": "attachment; filename=" + "iPASS_Project_wise_advices_" + new Date().getTime() + ".xlsx"
                                            });
                                            res.end(xls, 'binary');
                                        });
                                    } else {

                                        UserModel.find(signitureAndLogosQuery,{_id:1,signature:1},function(err,usersData){
                                            var sigmap={};

                                            usersData.forEach(function(eachUser,userIndex){
                                                sigmap[eachUser._id]=eachUser.signature;
                                            });
                                            adviceUtil.getOrganizationStamps(req.currentUser.organization).then(function(stamps){
                                                advicePdfGenerator.generatePdfBookPerProject(result, fileName, queryParam,totalAmount[0].totalAmount,req.currentUser.roles,sigmap,stamps).then(function (response) {
                                                    var filenamepdf = tmp + fileName+'.pdf';
                                                    var pdf = fs.readFileSync(filenamepdf);
                                                    res.writeHead(200, {'Content-Type': 'application/pdf'});
                                                    res.end(pdf, 'binary');
                                                });
                                            });
                                        });
                                    }
                                }
                                if(error){
                                    console.log("Error during excel generation :",error)
                                    res.send(new ErrorResult(404,apiUtils.i18n('advice.not.found.error.msg')));
                                }
                            });
                        }
                        else {
                            console.log("Error",error);
                        }
                    });
                }
            },
            function(rejected){
                res.send(new ErrorResult(404, rejected));
            });
    },
    aggregateByProject: function(req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var getPayeesIdsOfVirtualLedger=adviceUtil.getPayeesIdsOfVirtualLedger(queryParam.virtualLedger);
        getPayeesIdsOfVirtualLedger.then(function(payees){
                if(payees.length!==0){
                    queryParam.virtualLedgerPayees=payees
                }
                var query = adviceUtil.prepareAggregationSearchQuery(queryParam, req.currentUser.organization);
                if (apiUtils.isEmptyObject(query)) {
                    res.json({data:"empty"})
                }
                else {
                    AdviceModel.aggregate(query,function(error,result){
                        if(result){
                            res.send( new SuccessResponse(200, result, "", apiUtils.i18n('request.success.msg')) );
                        }
                        if(error){
                            console.log("Error aggregateByProject",error);
                            res.send(new ErrorResult(404, apiUtils.i18n('advice.not.found.error.msg')));
                        }
                    });
                }
            },
            function (rejected) {
                res.send(new ErrorResult('FAILED', rejected));
            });
    },
    listPayeeAdvices: function(req, res) {
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var query = adviceUtil.preparePaymentHistorySearchQuery(queryParam, req.currentUser.organization);
        //To fetch only latest advice version
        query.expired =  false;
        var page_number =queryParam.page ? queryParam.page:1;
        var page_size = queryParam.page_size ? queryParam.page_size : 10;
        if (apiUtils.isEmptyObject(query)) {
            res.json({data:"empty"})
        }
        else {
            var populate = {path:'project', match:{}};
            AdviceModel.paginate(query,{ page: Number(page_number), limit: Number(page_size), populate:populate },function(error,response){
                if(response){
                    res.send( new SuccessResponse(200, response.docs, response, "", apiUtils.i18n('request.success.msg')) );
                }
                if(error){
                    console.log("Error listPayeeAdvices",error);
                    res.send(new ErrorResult(404, apiUtils.i18n('advice.not.found.error.msg')));
                }
            });
        }
    },
    searchByAdviceNumber:function(req,res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var query = {};
        if(queryParam.adviceNo) { query['adviceNumber'] =  queryParam.adviceNo }
        if(queryParam.payeeId) { query['payee'] = new mongoose.Types.ObjectId(queryParam.payeeId) }

        AdviceModel.findOne(query,{_id : 1},function(err,data){
            if(err){
                console.log("inside if block");
                console.log(err);
                res.send(new ErrorResult('FAILED', apiUtils.i18n('record.not.found.error.msg')));
            }
            else if(data===undefined || data===null || data===''){
                res.send(new ErrorResult('FAILED', apiUtils.i18n('record.not.found.error.msg')));
            }
            else{
                console.log("inside else block");
                console.log(data);
                /*res.send(new SuccessResponse('OK', data, "", "success"));*/
                adviceUtil.getAdviceById(data._id).then(function(advice){
                    res.send( new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(advice))), "", apiUtils.i18n('request.success.msg')) );
                });
            }
        })
    },
    deleteAdvice : function(req,res){
        var queryParam=JSON.parse(req.query.q);
        var user = req.currentUser;
        var passCodeMatched = AdviceRoute.validate(user, queryParam.passcode);
        if (passCodeMatched) {
            AdviceModel.remove({_id:queryParam.id},
                function(error, result) {
                    if (error) {
                        return res.json(new ErrorResult(500, apiUtils.i18n('advice.delete.error.msg'), [error]))
                    }
                    else{
                        return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')));
                    }
                });
        }
        else {
            return res.json(new ErrorResult(304, apiUtils.i18n('user.passcode.match.error.msg')));
        }
    },
    deleteAdvices : function(req,res){
        /*hard delete*/
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var bulkDelete = [];
        var advicePromise = [];
        if(req.currentUser) {
            var user = req.currentUser;
            var passCodeMatched = AdviceRoute.validate(user, queryParam.passCode);
            if (passCodeMatched) {

                queryParam.ids.forEach(function (id) {
                    advicePromise.push(AdviceModel.findOne({_id: id},{adviceStatus:1}, function (error, advice) {
                        if(error) {
                            bulkDelete.push(false)
                        }
                        else {
                            //check the advice status and  user role
                            if( ( (req.currentUser.roles.indexOf(constants.ADVICE_ROLE.ROLE_ADMIN) !== -1) && (constants.ADVICE_STATUS_CATEGORIES.ALL_REJECTED.indexOf(advice.adviceStatus) !== -1) ) ||
                                ( (req.currentUser.roles.indexOf(constants.ADVICE_ROLE.ROLE_INITIATOR) !== -1) && (advice.adviceStatus === constants.ADVICE_STATUS_CATEGORIES.DRAFT) ) )
                            {
                                bulkDelete.push(true)
                            }
                            else {
                                bulkDelete.push(false);
                            }

                        }
                    })) ;
                });

                Q.allSettled( advicePromise ).then(function (resp) {
                    if(bulkDelete.indexOf(false) === -1) {
                        AdviceModel.remove({_id:{$in: queryParam.ids}},
                            function(error, result) {
                                if (error) {
                                    return res.json(new ErrorResult(500, apiUtils.i18n('advices.delete.error.msg'), [error]))
                                }
                                else{
                                    return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('advices.delete.success.msg')));
                                }
                            });
                    }
                    else {
                        res.send(new ErrorResult(550, apiUtils.i18n('advices.delete.permission.error.msg')));
                    }
                }, function(error) {
                    res.send(new ErrorResult(500, apiUtils.i18n('general.error.msg')));
                });


            } else {
                return res.send(new ErrorResult(304, apiUtils.i18n('user.passcode.match.error.msg')));
            }
        }
        else {
            res.send(new ErrorResult(500, apiUtils.i18n('user.auth.token.error.msg')))
        }

    },
    /**
     * Amends an existing advice
     * step 1: creates a new version for existing advice and deactivates existing advice
     * step 2: populate form data
     * step 3: saves newly versioned advice with populated data
     * @param req
     * @param res
     */
    amendAdvice: function(req, res) {
        var queryParams = req.body.q;
        adviceUtil.createVersion(queryParams._id).then(function(versionedAdvice){
            adviceUtil.populateAdviceDetails( versionedAdvice, queryParams ).then(function(updatedAdvice) {
                updatedAdvice.save(function(err, advice){
                    if (err) {
                        //if any error occurred while versioning and populating advice, re-activate old advice and delete new advice
                        adviceUtil.activateAdvice(queryParams._id).then(function(activatedAdvice){
                            adviceUtil.deleteVersionedAdvice(versionedAdvice._id).then(function(res){
                                return res.json(new ErrorResult('FAILED', apiUtils.i18n('advice.save.error.msg'), [err]))
                            }, function(error){
                                return res.json(new ErrorResult('FAILED', apiUtils.i18n('advice.save.error.msg'), [err]))
                            })
                        }, function(error){
                            return res.json(new ErrorResult('FAILED', apiUtils.i18n('advice.save.error.msg'), [err]))
                        })
                    }
                    if(queryParams.comment) {
                        var comment = new CommentModel({
                            text: queryParams.comment,
                            user: req.currentUser._id,
                            organization: req.currentUser.organization
                        });
                        comment.save(function (err, data) {
                            if (err) {
                                res.send(err);
                            }  else {
                                AdviceModel.update({"_id":advice._id},{"$addToSet":{comments:data._id}},function(error, advice){
                                    if(error) {
                                        console.log("Failed to save comment Id: "+data._id+" in advice: "+advice._id);
                                        return res.send(error);
                                    }
                                });
                            }
                        })
                    }
                    return res.json(new SuccessResponse(200, advice, {}, apiUtils.i18n('request.success.msg')));
                })
            }, function(error){
                //if any error occurred while versioning and populating advice, re-activate old advice and delete new advice
                adviceUtil.activateAdvice(queryParams._id).then(function(activatedAdvice){
                    adviceUtil.deleteVersionedAdvice(versionedAdvice._id).then(function(res){
                        return res.json(new ErrorResult(500, apiUtils.i18n('advice.populate.error.msg'), [error]))
                    }, function(error){
                        return res.json(new ErrorResult(500, apiUtils.i18n('advice.populate.error.msg'), [error]))
                    })
                }, function(error){
                    return res.json(new ErrorResult(500, apiUtils.i18n('advice.populate.error.msg'), [error]))
                })
            });
        }, function(error){
            return res.json(new ErrorResult(500, apiUtils.i18n('advice.new.version.error.msg'), [error]))
        })
    },
    fetchTotalAmount:function(req,res){
        console.log('------advices/fetchTotalAmount...');
        var totalAmtAggrate=[];
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var query = adviceUtil.preparePaymentHistorySearchQuery(queryParam, req.currentUser.organization);
        //To fetch only latest advice version
        query.expired =  false;


        totalAmtAggrate.push({ $match: query });
        totalAmtAggrate.push({ $group: { _id: 0, total: { $sum: "$requestedAmount" } } });

        console.log(totalAmtAggrate);
        /*var page_number =queryParam.page ? queryParam.page:1;
         var page_size = queryParam.page_size ? queryParam.page_size : 10;*/
        if (apiUtils.isEmptyObject(query)) {
            res.json({data:"empty"})
        }
        else {
            AdviceModel.aggregate(totalAmtAggrate,function(err,total){
                if(total){
                    return res.json(new SuccessResponse(200, total, {}, apiUtils.i18n('request.success.msg')));
                }
                else{
                    console.log("Error fetchTotalAmount",err);
                    res.send(new ErrorResult(404, apiUtils.i18n('advice.not.found.error.msg')));
                }

            })
        }
    },
    getAdviceCountBasedOnSearchCriteria: function(req, res) {
        var deffered=Q.defer();
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        if(queryParam.virtualLedger){
            adviceUtil.getVirtualLedgerPayees(queryParam.virtualLedger).then(function (payees){
                queryParam.virtualLedgerPayees=payees;
                deffered.resolve(queryParam)
            },function (reject) {
                deffered.reject()
            });

        }
        else {
            deffered.resolve(queryParam)
        }
        deffered.promise.then(function(queryParam){
            var aggregateQuery = adviceUtil.prepareAggregationSearchQueryForGetAdviceCount(queryParam, req.currentUser.organization);
            var aggregateQuery = adviceUtil.prepareAggregationSearchQueryForGetAdviceCount(queryParam, req.currentUser.organization);
            if (apiUtils.isEmptyObject(aggregateQuery)) {
                res.json({data:"empty"})
            }
            else {
                AdviceModel.aggregate(aggregateQuery,function(error,result){
                    if(result){
                        console.log("result..........")
                        console.log(result)
                        console.log("result..........")
                        if(result.length > 0) {
                            result[0].downloadLimit = apiUtils.getExternalConfigFile().maxDownloadLimit;
                        }
                        res.send( new SuccessResponse(200, result, "", apiUtils.i18n('request.success.msg')) );
                    }
                    if(error){
                        console.log("Error getAdviceCountBasedOnSearchCriteria",error);
                        res.send(new ErrorResult(404, apiUtils.i18n('advice.not.found.error.msg')));
                    }
                });
            }
        },function(reject){
            res.send(new ErrorResult(404, reject));
        });
    }
};

module.exports=AdviceRoute;
