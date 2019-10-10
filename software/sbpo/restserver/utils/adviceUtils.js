var Q = require('q');
var AdviceModel = require('../models/AdviceModel');
var OrganizationModel = require('../models/OrganizationModel');
var CommentModel = require('../models/CommentModel');
var PayeeModel = require('../models/PayeeModel');
var ProjectModel = require('../models/ProjectModel');
var apiUtils = require('./apiUtils');
var paymentRequestUtils = require('./paymentRequestUtils');
var constants = require('./constants');
var mailSend=require('../routes/Mail/mailService');
var userUtils = require('./userUtils');
var moment = require('moment');
var mongoose = require('mongoose');
var status = require('../enums/status');
var ObjectId = require('mongoose').Types.ObjectId;
var virtualLedgerModel = require('../models/VirtualLedgerModal');
var appConfig=require('../utils/apiUtils').getExternalConfigFile();
var adviceUtil= {
    /**
     *
     * @param organizationId
     */
    getOrganizationStamps:function(organizationId){
        var deferred = Q.defer();
        OrganizationModel.findOne({_id:organizationId},function(err,organizationStamps){
            if(organizationStamps){
                deferred.resolve(organizationStamps);
            }
            else {
                deferred.reject(err);
            }
        });

        return deferred.promise;

    },
    /**
     * update saved(Draft) advice
     * @param queryParam
     * @param req
     * @returns {*|promise}
     */
    updateAdvice: function(queryParam, req) {
        var deferred = Q.defer();
        var query = apiUtils.populateAdviceForUpdate(queryParam, req.currentUser.organization)
        console.log("updateAdvice query.......................................")
        console.log(query)
        console.log("updateAdvice query.......................................")
        AdviceModel.update(
            { _id: queryParam._id },
            { $set: apiUtils.populateAdviceForUpdate(queryParam, req.currentUser.organization)},
            { upsert: false },function(err,advice){
                if(err){
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(advice);
                }
            }
        );
        return deferred.promise;
    },
    /**
     * save Advice
     * @param queryParam
     * @param updatedObject
     * @returns {*|promise}
     */
    saveAdvice: function(queryParam, updatedObject) {
        var deferred = Q.defer();
        AdviceModel.update(
            { _id: queryParam._id }, updatedObject,
            { upsert: true },function(err,data){
                if(err){
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(data);
                }
            }
        );
        return deferred.promise;
    },
    /**
     * Get advice by advice id
     * @param id
     * @param includeComments
     * @returns {*|promise}
     */
    getAdviceById: function (id, includeComments) {
        var deferred = Q.defer();
        var populate = [
            { path:'user' },
            { path:'secondLevelApprover' },
            { path:'thirdLevelApprover' },
            { path:'disburser' },
            { path: 'payee', populate: { path: 'user'}},
            { path:'project' },
            { path:'rejectedBy' },
            { path:'category' },
            { path:'paymentType' },
            { path:'organization' },
            { path:'bank' },
            { path:'paymentRequestId' },
            { path : 'ledger' }
        ];

        if(includeComments) {
            populate.push({path:'comments', populate:{ path: 'user'}, options:{ sort:{'createdDate':-1}}})
        }
        AdviceModel.findOne({_id: id})
            .populate(populate)
            .exec(function (error, data) {
                if (error) {
                    deferred.reject(error);
                }
                else {
                    if (data) { deferred.resolve(data);}
                    else { deferred.resolve({}); }
                }
            });
        return deferred.promise;
    },
    /**
     * Get advice by advice id
     * @param id
     * @param includeComments
     * @returns {*|promise}
     */
    getAdviceByIdWithRequiredFields: function(id, includeComments) {
        var deferred = Q.defer();

        adviceUtil.preparePopulateFields(id, includeComments).then(function(populate){
            AdviceModel.findOne({_id: id})
                .populate(populate)
                .exec(function (error, data) {
                    if (error) {
                        deferred.reject(error);
                    }
                    else {
                        if (data) {
                            deferred.resolve(data);}
                        else { deferred.resolve({}); }
                    }
                });
        })

        return deferred.promise;
    },
    /**
     * populate required fields of advice
     * @param id
     * @param includeComments
     * @returns {*|promise}
     */
    preparePopulateFields: function(id, includeComments) {
        var deferred = Q.defer();
        var populate;
        populate = [
            { path:'user', select: { '_id':1,'firstName': 1, 'middleName': 1, 'lastName': 1, 'email':1, 'signature':1} },
            { path:'secondLevelApprover',  select: { '_id':1,'firstName': 1, 'middleName': 1, 'lastName': 1, 'email':1, 'signature':1}},
            { path:'thirdLevelApprover', select: { '_id':1,'firstName': 1, 'middleName': 1, 'lastName': 1, 'email':1, 'signature':1} },
            { path:'disburser', select: { '_id':1,'firstName': 1, 'middleName': 1, 'lastName': 1, 'email':1, 'signature':1} }
        ];
        if(includeComments) {
            populate.push({
                path:'comments', populate:{ path: 'user',select: { '_id':1,'firstName': 1, 'middleName': 1, 'lastName': 1}},
                options:{ sort:{'createdDate':-1}}
            })
        }
        populate.push({ path: 'payee', populate: { path: 'user',select: { '_id':1,'nickName':1,'firstName': 1, 'middleName': 1, 'lastName': 1, 'email':1}}});
        populate.push({ path:'project', select: { '_id':1,'projectName':1} });
        populate.push({ path:'rejectedBy', select: { '_id':1,'firstName': 1, 'middleName': 1, 'lastName': 1, 'email':1} });
        populate.push({ path:'category', select: { '_id':1,'name': 1, 'type': 1}});
        populate.push({ path:'paymentType', select: { '_id':1,'name': 1, 'type': 1} });
        populate.push({ path:'organization', select: { '_id':1,'stamp': 1}});
        populate.push({ path:'bank',  select: {'accountName':1, 'accountNo':1, 'bankName':1, 'branchName':1, 'ifscCode':1, 'creditCardNumber':1, 'debitCardNumber':1, openingBalance:1, accountType:1}});
        populate.push({ path:'paymentRequestId' });
        populate.push({ path : 'ledger',select: { '_id':1,'name': 1, 'discriminator': 1} });
        deferred.resolve(populate);

        return deferred.promise;
    },
    /**
     * Get advice status by logged-in user
     * @param role : currently logged-in user
     * @returns {*}
     */
    getAdviceApproveStatusByRole: function (role) {
        return constants.ADVICE_APPROVE_STATUS_BY_ROLE[role];
    },
    /**
     * Get advice rejected status by logged-in user
     * @param role : currently logged-in user
     * @returns {*}
     */
    getAdviceRejectStatusByRole: function (role) {

        return constants.ADVICE_REJECT_STATUS_BY_ROLE[role];

    },

    createNewAdvice: function (queryParam, organization) {
        var utils = this;
        var deferred = Q.defer();

        PayeeModel.findOne({_id: queryParam.payee._id}, function (err, payeeInstance) {
            if (payeeInstance) {
                var adviceObj = apiUtils.populateAdvice(queryParam, organization);
                adviceObj['payee'] = payeeInstance._id;
                var adviceModel = new AdviceModel(adviceObj);
                adviceModel.save(function (err, adviceInstance) {
                    if (err) {
                        console.log(err)
                        deferred.reject(err);
                    }
                    else {
                        if (queryParam.comment != undefined) {
                            var comment = new CommentModel({
                                text: queryParam.comment,
                                user: queryParam.userId,
                                organization: organization
                            });
                            var commentArr=[];
                            comment.save(function (err, data) {
                                if (err) {
                                    utils.afterCreateAdvice(queryParam, adviceInstance, organization).then(function () {
                                        deferred.resolve(adviceInstance);
                                    }, function(err) {
                                        deferred.reject(err);
                                    });
                                } else {
                                    if(adviceInstance.isPaymentRequest){
                                        var paymentrequestDetails=paymentRequestUtils.getPaymentRequestById(adviceInstance.paymentRequestId).then(function(paymentrequestDetails){
                                            if(paymentrequestDetails.comments){
                                                paymentrequestDetails.comments.push(data._id)
                                                updateAdviceComments(adviceInstance._id,paymentrequestDetails.comments).then(function(advice){
                                                    utils.afterCreateAdvice(queryParam, adviceInstance, organization).then(function () {
                                                        deferred.resolve(adviceInstance);
                                                    }, function(err) {
                                                        deferred.reject(err);
                                                    });
                                                }).catch(function(error){
                                                    deferred.reject(error);
                                                })
                                            }
                                            else {
                                                commentArr.push(data._id);
                                                updateAdviceComments(adviceInstance._id,commentArr).then(function(advice){
                                                    utils.afterCreateAdvice(queryParam, adviceInstance, organization).then(function () {
                                                        deferred.resolve(adviceInstance);
                                                    }, function(err) {
                                                        deferred.reject(err);
                                                    });
                                                }).catch(function(error){
                                                    deferred.reject(error);
                                                })
                                            }
                                        }).catch(function(error){
                                            console.log("Error",error);
                                        });
                                    }
                                    else {
                                        commentArr.push(data._id);
                                        updateAdviceComments(adviceInstance._id,commentArr).then(function(advice){
                                            utils.afterCreateAdvice(queryParam, adviceInstance, organization).then(function () {
                                                deferred.resolve(adviceInstance);
                                            }, function(err) {
                                                deferred.reject(err);
                                            });
                                        }).catch(function(error){
                                            deferred.reject(error);
                                        })
                                    }
                                }})
                        } else if(adviceInstance.isPaymentRequest){
                            var paymentrequestDetails=paymentRequestUtils.getPaymentRequestById(adviceInstance.paymentRequestId).then(function(paymentrequestDetails){
                                if(paymentrequestDetails.comments){
                                    updateAdviceComments(adviceInstance._id,paymentrequestDetails.comments).then(function(advice){
                                        utils.afterCreateAdvice(queryParam, adviceInstance, organization).then(function () {
                                            deferred.resolve(adviceInstance);
                                        }, function(err) {
                                            deferred.reject(err);
                                        });
                                    }).catch(function(error){
                                        deferred.reject(error);
                                    })
                                }
                                else {
                                    deferred.resolve(adviceInstance);
                                }
                            })
                        }else{
                            utils.afterCreateAdvice(queryParam, adviceInstance, organization).then(function () {
                                deferred.resolve(adviceInstance);
                            }, function(err) {
                                deferred.reject(err);
                            });
                        }

                    }
                });
            } else {
                deferred.reject('Payee not found');
            }

        });
        return deferred.promise;
    },

    afterCreateAdvice: function (queryParam, advice, organization) {
        var deferred = Q.defer();
        if (queryParam.isLegacy) {
            mailSend.sendMailForCreateLegacyAdvice(queryParam,organization,advice, function (emaildata) {
                if (emaildata.res === 'success') {
                    deferred.resolve(emaildata);
                }
            });
        }
        else if(queryParam.status === status.DRAFT.value ){
            console.log("draft status");
            deferred.resolve("draft status");
        }
        else {
            adviceUtil.getReceiptsByStatus(advice.status, organization).then(function(recipients){
                apiUtils.getAdviceById(advice._id).then(function(completeAdvice){
                    mailSend.sendMailForApproval(completeAdvice, recipients).then(function(mailRes){
                        if(mailRes.status==='success'){
                            if(completeAdvice.isPaymentRequest){
                                mailSend.sendMailOnInitiatePaymentRequest(completeAdvice).then(function(initiateResponse){
                                    if(initiateResponse.status==='success'){
                                        deferred.resolve(mailRes);
                                    }
                                    else {
                                        deferred.reject('error in email sending');
                                    }
                                });
                            }
                            else {
                                deferred.resolve(mailRes);
                            }
                        }
                        else{
                            deferred.reject('error in email sending');
                        }
                    }, function (error) {
                        deferred.reject('error in email sending');
                    });
                });
            });

        }
        return deferred.promise;
    },
    /*Return the updated query object to update the adviceStatus*/
    getAdviceStatusUpdateQuery: function ( user , queryParam , isApproved) {
        var updateQuery = {};
        //update the query to update the advice status
        for(var i=0;i<user.roles.length;i++){
            if ( user.roles[i]==='ROLE_LEVEL2APPROVER' && queryParam.status ==="Submitted" ){
                updateQuery = {
                    secondLevelApprover : user._id,
                    adviceStatus : isApproved ? this.getAdviceApproveStatusByRole(user.roles[i]) :
                        this.getAdviceRejectStatusByRole(user.roles[i]),
                    rejectedBy : isApproved ? null : user._id
                }
            }
            else if ( user.roles[i]==='ROLE_LEVEL3APPROVER' && queryParam.status ==="Level 2 Approved" ){
                updateQuery = {
                    thirdLevelApprover : user._id,
                    adviceStatus : isApproved ? this.getAdviceApproveStatusByRole(user.roles[i]):
                        this.getAdviceRejectStatusByRole(user.roles[i], queryParam.value),
                    rejectedBy : isApproved ? null : user._id
                }
            }
            else if( user.roles[i]==='ROLE_DISBURSER' && queryParam.status ==="Level 3 Approved" ) {
                updateQuery = {
                    disburser : user._id,
                    adviceStatus : isApproved ? this.getAdviceApproveStatusByRole(user.roles[i]):
                        this.getAdviceRejectStatusByRole(user.roles[i], queryParam.value),
                    rejectedBy : isApproved ? null : user._id
                };
                if(isApproved) {
                    updateQuery['disburserDate'] = queryParam.disbursementDate;
                }
            }
        }
        return updateQuery;
    },
    getShortAdvice: function(advice) {
        var jsonAdvice = {
            _id: advice._id,
            adviceNumber: advice.adviceNumber,
            adviceStatus: advice.adviceStatus,
            requestedDate: advice.requestedDate,
            requestedAmount: advice.requestedAmount,
            amountInWords: apiUtils.convertINRToWord(advice.requestedAmount),
            paymentType: advice.paymentType ? advice.paymentType.name : "",
            requestedBy: advice.requestedBy,
            initiatedBy: advice.initiatedBy,
            payee: {
                name: advice.payee.user ? (advice.payee.user.firstName+' '+advice.payee.user.middleName+' '+advice.payee.user.lastName) : "",
                email: advice.payee ? advice.payee.email : ""
            },
            project: {
                name: advice.project ? advice.project.projectName : "",
                startDate: advice.project ? advice.project.startDate : "",
                location: advice.project ? advice.project.projectLocation : ""
            },
            comments: []
        };

        var comments = [];
        advice.comments.forEach(function(comment) {
            comments.push({text: comment.text, addedBy: comment.user.firstName + '' + comment.user.lastName })
        });
        jsonAdvice.comments = comments;
        return jsonAdvice;
    },
    fetchAdvicesByStatusCategory: function(queryParam, currentUser) {
        var deferred = Q.defer();
        var adviceQuery = this.getAdviceStatusesQueryToDisplay(queryParam, currentUser);
        if(adviceQuery){
            if(['project', 'payee', 'paymentType', 'category'].indexOf(queryParam.groupByCriteria) >= 0){
                var aggQuery = [
                    { $match: adviceQuery }
                ];
                if(queryParam.groupByCriteria === 'project') {
                    aggQuery = aggQuery.concat([
                        {$lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" }},
                        {$unwind:"$project"},
                        {$group : {_id : "$project._id", project: {$first: "$project"}, advicesCount: {$sum: 1}, requestedAmount: {$sum: "$requestedAmount"},
                            "priorityCount": {"$sum": {"$cond": [ "$urgent", 1, 0 ]}}}},
                        {"$project":{project:1, advicesCount:1, requestedAmount:1,priorityCount:1, projectName:{"$toLower": "$project.projectName"}}},
                        {"$sort":{"projectName":1}}
                    ]);
                } else if(queryParam.groupByCriteria === 'payee') {
                    aggQuery = aggQuery.concat([
                        {$lookup: { from: "payees", localField: "payee", foreignField: "_id", as: "payee" }},
                        {$unwind:"$payee"},
                        {$lookup: { from: "users", localField: "payee.user", foreignField: "_id", as: "payee.user" }},
                        {$unwind:"$payee.user"},
                        {$group : {_id : "$payee._id", payee: {$first: "$payee"}, advicesCount: {$sum: 1}, requestedAmount: {$sum: "$requestedAmount"},
                            "priorityCount": {"$sum": {"$cond": [ "$urgent", 1, 0 ]}}}},
                        {"$project":{payee:1, advicesCount:1, requestedAmount:1,priorityCount:1,
                            firstName:{"$toLower": "$payee.user.firstName"},
                            middleName:{"$toLower": "$payee.user.middleName"},
                            lastName:{"$toLower": "$payee.user.lastName"}
                        }},
                        {"$sort" : { "firstName" : 1, "middleName" : 1, "lastName" : 1 } }
                    ]);
                } else if(['paymentType', 'category'].indexOf(queryParam.groupByCriteria) >= 0) {
                    var groupQuery = {_id : "$" + queryParam.groupByCriteria + "._id", advicesCount: {$sum: 1}, requestedAmount: {$sum: "$requestedAmount"}};
                    groupQuery[queryParam.groupByCriteria] = {$first: "$" + queryParam.groupByCriteria};
                    aggQuery = aggQuery.concat([
                        {$lookup: { from: "customFields", localField: queryParam.groupByCriteria, foreignField: "_id", as: queryParam.groupByCriteria }},
                        {$unwind:{path:"$" + queryParam.groupByCriteria,preserveNullAndEmptyArrays: true}},
                        {$group : groupQuery}
                    ]);
                }
                //commenting the previous aggregate Query
                /*if(queryParam.state) {
                 AdviceModel.aggregate(
                 aggQuery
                 , function (err, advices) {
                 console.log(advices);
                 if (advices) {
                 deferred.resolve(advices);
                 }
                 if (err) {
                 deferred.reject(err);
                 }
                 })
                 /!*}*!/
                 /!* else {*!/
                 */
                //performing search query
                adviceUtil.fetchAdvicesByLimit(aggQuery,queryParam.groupByCriteriaSkip,queryParam.groupByCriteriaLimit).then(function (response) {
                    if(response !==null){
                        deferred.resolve(response)
                    }
                    else{
                        deferred.reject("error")
                    }
                })
                /*}*/
            } else {
                if ((!queryParam.paymentType) && ("paymentType" in queryParam)) {
                    adviceQuery.paymentType = null;
                }
                if ((!queryParam.category) && ("category" in queryParam)) {
                    adviceQuery.category = null;
                }
                var populate = [{
                    path: 'payee', select: 'user',
                    populate: {path: 'user', select: 'firstName middleName lastName'}
                }, {path: 'project'}];
                var sort = {urgent: -1};
                if (queryParam.sortCriteria) {
                    sort.requestedDate = queryParam.sortCriteria.requestedDate;
                }
                var advicesQueryObject= AdviceModel.find(adviceQuery)
                    .sort(sort)
                    .populate(populate)
                if(!queryParam.state){
                    advicesQueryObject.skip(queryParam.adviceSkip).limit(queryParam.adviceLimit)
                }
                advicesQueryObject.exec(function (err, advices) {
                    if (err) {
                        deferred.reject(err);
                    }
                    else if (advices && queryParam.state) {
                        deferred.resolve(advices);
                    }
                    else{
                        var responseObject={}
                        responseObject.advices=advices;
                        deferred.resolve(responseObject);
                    }
                });
            }

        } else {
            deferred.reject('Invalid status found');
        }
        return deferred.promise;
    },
    getAdviceStatusesQueryToDisplay : function (queryParam, user) {
        var adviceStatusesQuery = apiUtils.prepareSearchQuery(queryParam, user.organization);
        adviceStatusesQuery.expired = false;
        var statusCategory = queryParam.statusCategory;
        if(statusCategory) {
            var adviceStatuses = [];
            if (statusCategory.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()) {
                for (var i = 0; i < user.roles.length; i++) {
                    var adviceStatus = constants.ADVICE_DISPLAY_STATUS_BY_ROLE[user.roles[i]];
                    if (adviceStatus) {
                        adviceStatuses.push(adviceStatus);
                    }
                }
                adviceStatusesQuery.adviceStatus = {$in: adviceStatuses};
            } else if (statusCategory.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()) {
                adviceStatuses = ["Draft", "Disbursed", "Level 2 Rejected", "Level 3 Rejected", "Disburser Rejected","Void"];
                adviceStatusesQuery.adviceStatus = {$nin: adviceStatuses};
            } else if (statusCategory.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {
                adviceStatuses = ["Level 2 Rejected", "Level 3 Rejected", "Disburser Rejected"];
                adviceStatusesQuery.adviceStatus = {$in: adviceStatuses};
            } else if (statusCategory.toUpperCase() === constants.ADVICE_STATUS_CATEGORIES.DISBURSED.toUpperCase()) {
                adviceStatusesQuery.adviceStatus = "Disbursed";
            }
        }
        return adviceStatusesQuery;
    },
    getAdviceByQuery: function(query) {
        var deferred = Q.defer();
        var populate = [{ path: 'payee', select:'user',
            populate: { path: 'user' , select:'firstName middleName lastName'}
        }, { path:'project' }];
        AdviceModel.find(query).populate(populate).exec(function(err,data){
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(data);
            }
        });
        return deferred.promise;
    },
    getReceiptsByStatus:function(status, organization){
        var deferred = Q.defer();
        if(status===constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER){
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_LEVEL3APPROVER], organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        else if(status===constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER){
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_DISBURSER],organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        else if(status===constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_INITIATOR_ROLE){
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_INITIATOR],organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        else{
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_LEVEL2APPROVER], organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        return deferred.promise;
    },
    /**
     *
     * @param status
     * @param organization
     * @returns {*|promise}
     */
    getRejectAdviceReceiptsByStatus:function(status, organization){
        var deferred = Q.defer();
        if(status===constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_LEVEL2APPROVER){
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_INITIATOR], organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        else if(status===constants.ADVICE_REJECT_STATUS_BY_ROLE.ROLE_LEVEL3APPROVER){
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_LEVEL2APPROVER],organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        else{
            userUtils.getUserByRoles([constants.ADVICE_ROLE.ROLE_LEVEL3APPROVER], organization).then(function(users){
                deferred.resolve(users);
            }, function(error){
                deferred.reject(error);
            });
        }
        return deferred.promise;
    },
    prepareAggregationSearchQuery: function(queryParam, organizationId) {
        var query = apiUtils.prepareSearchQuery(queryParam, organizationId);
        query["expired"] = false;
        var aggregateQuery = [];

        var matchParams = apiUtils.getMatchParams(query);
        aggregateQuery.push({ $match: {$and: matchParams}});
        aggregateQuery.push({
            $lookup:{
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project"
            }
        });

        aggregateQuery.push({
            $unwind:"$project"
        });

        aggregateQuery.push(
            {$group : {_id : "$project._id", project: {$first: "$project.projectName"}, advicesCount: {$sum: 1}, total: {$sum: "$requestedAmount"}}}
        );

        return aggregateQuery;
    },
    preparetotalAmountQuery:function(query, queryParam){
        var totalAmountQuery = [];
        var matchParams = apiUtils.getMatchParams(query);
        totalAmountQuery.push({ $match: {$and: matchParams}});
        if (queryParam.type !== constants.DOWNLOAD_FILE_TYPE.EXCEL) {
            totalAmountQuery.push( { $limit : appConfig.maxDownloadLimit });
        }
        totalAmountQuery.push(
            { $group : {
                _id : null,
                total : { $sum : "$requestedAmount" }
            }
            },{ "$unwind": "$total" });
        return totalAmountQuery;
    },
    prepareAggregationQuery: function(query,queryParam) {
        var aggregateQuery = [];
        var matchParams = apiUtils.getMatchParams(query);
        aggregateQuery.push({ $match: {$and: matchParams}});

        aggregateQuery.push(
            {$lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" }},
            {$unwind:"$project"},
            {$lookup: { from: "payees", localField: "payee", foreignField: "_id", as: "payee" }},
            {$unwind:"$payee"},
            {$lookup: { from: "users", localField: "payee.user", foreignField: "_id", as: "payee.user" }},
            {$unwind:"$payee.user"},

            {$lookup: { from: "customFields", localField: "paymentType", foreignField: "_id", as: "paymentType" }},
            {$unwind:{path:"$paymentType",preserveNullAndEmptyArrays: true}},

            {$lookup: { from: "customFields", localField: "category", foreignField: "_id", as: "category" }},
            {$unwind:{path:"$category",preserveNullAndEmptyArrays: true}},

            {$lookup: { from: "virtualLedgers", localField: "ledger", foreignField: "_id", as: "ledger" }},
            {$unwind:{path:"$ledger",preserveNullAndEmptyArrays: true}},

            {$lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" }},
            {$unwind:"$user"},

            {$lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank" }},
            {$unwind:{path:"$bank",preserveNullAndEmptyArrays: true}},

            {$sort: { "disburserDate" : 1 } }
        );

        if(queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
            && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
            && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {
            aggregateQuery.push(
                {$lookup: { from: "users", localField: "secondLevelApprover", foreignField: "_id", as: "secondLevelApprover" }},
                {$unwind:"$secondLevelApprover"},

                {$lookup: { from: "users", localField: "thirdLevelApprover", foreignField: "_id", as: "thirdLevelApprover" }},
                {$unwind:"$thirdLevelApprover"},

                {$lookup: { from: "users", localField: "disburser", foreignField: "_id", as: "disburser" }},
                {$unwind:"$disburser"},

                { $project: {
                    "user._id": 1,
                    "user.firstName": 1,
                    "user.middleName": 1,
                    "user.lastName": 1,
                    "payee.bankName": 1,
                    "payee.ifscCode": 1,
                    "payee.bankBranch": 1,
                    "payee.user.firstName": 1,
                    "payee.user.middleName": 1,
                    "payee.user.lastName": 1,
                    "ledger.name":1,
                    "category.name" : 1,
                    "project": 1,
                    "bank": 1,
                    "adviceNumber": 1,
                    "requestedDate": 1,
                    "requestedAmount": 1,
                    "billAmountDue": 1,
                    "type": 1,
                    "requestedBy": 1,
                    "initiatedBy": 1,
                    "adviceStatus": 1,
                    "disburserDate": 1,
                    "accountNumber": 1,
                    "chequeNumber": 1,
                    "creditCardNumber": 1,
                    "debitCardNumber": 1,
                    "description": 1,
                    "others": 1,
                    "seq": 1,
                    "version": 1,
                    "endDate":1,
                    "paymentType":1,

                    "secondLevelApprover._id": 1,
                    "secondLevelApprover.firstName": 1,
                    "secondLevelApprover.lastName": 1,
                    "secondLevelApprover.middleName": 1,
                    "secondLevelApprover.roles": 1,
                    "secondLevelApprover.phoneNumber": 1,
                    "secondLevelApprover.email": 1,

                    "thirdLevelApprover._id": 1,
                    "thirdLevelApprover.firstName": 1,
                    "thirdLevelApprover.lastName": 1,
                    "thirdLevelApprover.middleName": 1,
                    "thirdLevelApprover.roles": 1,
                    "thirdLevelApprover.phoneNumber": 1,
                    "thirdLevelApprover.email": 1,

                    "disburser._id": 1,
                    "disburser.firstName": 1,
                    "disburser.lastName": 1,
                    "disburser.middleName": 1,
                    "disburser.roles": 1,
                    "disburser.phoneNumber": 1,
                    "disburser.email": 1,

                    "organization":1
                }
                });

            aggregateQuery.push({$sort : {"disburserDate": 1}});
        }
        else {
            aggregateQuery.push({ $project: {
                "user._id": 1,
                "user.firstName": 1,
                "user.middleName": 1,
                "user.lastName": 1,
                "payee.user.firstName": 1,
                "payee.user.middleName": 1,
                "payee.user.lastName": 1,
                "ledger.name":1,
                "category.name" : 1,
                "project": 1,
                "user.payee.user": 1,
                "bank": 1,
                "adviceNumber": 1,
                "requestedDate": 1,
                "requestedAmount": 1,
                "billAmountDue": 1,
                "type": 1,
                "requestedBy": 1,
                "initiatedBy": 1,
                "adviceStatus": 1,
                "disburserDate": 1,
                "accountNumber": 1,
                "chequeNumber": 1,
                "creditCardNumber": 1,
                "debitCardNumber": 1,
                "description": 1,
                "others": 1,
                "seq": 1,
                "version": 1,
                "endDate": 1,
                "secondLevelApprover._id": 1,
                "secondLevelApprover.firstName": 1,
                "secondLevelApprover.lastName": 1,
                "secondLevelApprover.middleName": 1,
                "secondLevelApprover.roles": 1,
                "secondLevelApprover.phoneNumber": 1,
                "secondLevelApprover.email": 1,

                "thirdLevelApprover._id": 1,
                "thirdLevelApprover.firstName": 1,
                "thirdLevelApprover.lastName": 1,
                "thirdLevelApprover.middleName": 1,
                "thirdLevelApprover.roles": 1,
                "thirdLevelApprover.phoneNumber": 1,
                "thirdLevelApprover.email": 1,

                "disburser._id": 1,
                "disburser.firstName": 1,
                "disburser.lastName": 1,
                "disburser.middleName": 1,
                "disburser.roles": 1,
                "disburser.phoneNumber": 1,
                "disburser.email": 1
            }
            });
        }


        /*aggregateQuery.push({
         $group : {
         _id : null,
         adviceDetails:
         {
         $addToSet :
         {
         requestedAmount:'$requestedAmount',
         adviceId:'$_id'
         }
         },
         total : { $sum : "$requestedAmount" }
         }
         });*/
        return aggregateQuery;
    },
    signitureAndLogosQuery:function(organizationId) {
        var query={};

        query.$and=[{signature:{$exists:true}},
            {roles:{$in:['ROLE_INITIATOR','ROLE_LEVEL2APPROVER','ROLE_LEVEL3APPROVER','ROLE_DISBURSER']}},
            {organization:organizationId}
        ];

        return query;
    },
    downloadAllSearchQuery: function(queryParam, organizationId) {
        var query = apiUtils.prepareSearchQuery(queryParam, organizationId);
        query["expired"] = false;
        var aggregateQuery = adviceUtil.prepareAggregationQuery(query,queryParam);
        if (queryParam.type !== constants.DOWNLOAD_FILE_TYPE.EXCEL) {
            aggregateQuery.push( { $limit : appConfig.maxDownloadLimit });
        }
        return aggregateQuery;
    },
    totalAmountQuery:function(queryParam, organizationId){
        var query = apiUtils.prepareSearchQuery(queryParam, organizationId);
        query["expired"] = false;
        var totalAmountQuery = adviceUtil.preparetotalAmountQuery(query,queryParam);
        return totalAmountQuery;
    },
    downloadAllByStatusQuery: function(queryParam) {
        var query = {};
        query.organization =  mongoose.Types.ObjectId(queryParam.organization.toString());
        query.adviceStatus = queryParam.adviceStatus;
        var aggregateQuery = adviceUtil.prepareAggregationQuery(query,queryParam);
        return aggregateQuery;
    },
    totalAmountInPendingInProgress:function(queryParam){
        var query = {};
        query.organization =  mongoose.Types.ObjectId(queryParam.organization.toString());
        query.adviceStatus = queryParam.adviceStatus;
        var totalAmount=adviceUtil.preparetotalAmountQuery(query,queryParam);
        return totalAmount;
    },
    isEmptyObject: function(obj) {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    },
    prepareAggregationSearchQueryForPerProject: function(queryParam, organizationId, limit) {
        var query = {};
        if(queryParam.status === constants.ADVICE_STATUS_CATEGORIES.DISBURSED){
            query   = apiUtils.prepareSearchQuery(queryParam, organizationId);
        }
        else {
            query.organization =  mongoose.Types.ObjectId(queryParam.organization.toString());
            query.adviceStatus = queryParam.adviceStatus;
        }
        var aggregateQuery = [];
        var date = {};
        var matchParams = apiUtils.getMatchParams(query);
        matchParams.push({'expired': false});
        matchParams.push({'isActive': true});
        aggregateQuery.push({ $match: {$and: matchParams}});
        aggregateQuery.push(
            {$lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" }},
            {$unwind:"$project"},

            {$lookup: { from: "payees", localField: "payee", foreignField: "_id", as: "payee" }},
            {$unwind:"$payee"},

            {$lookup: { from: "users", localField: "payee.user", foreignField: "_id", as: "payee.user" }},
            {$unwind:"$payee.user"},

            {$lookup: { from: "customFields", localField: "paymentType", foreignField: "_id", as: "paymentType" }},
            {$unwind:{path:"$paymentType",preserveNullAndEmptyArrays: true}},

            {$lookup: { from: "customFields", localField: "category", foreignField: "_id", as: "category" }},
            {$unwind:{path:"$category",preserveNullAndEmptyArrays: true}},

            {$lookup: { from: "virtualLedgers", localField: "ledger", foreignField: "_id", as: "ledger" }},
            {$unwind:{path:"$ledger",preserveNullAndEmptyArrays: true}},

            {$lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" }},
            {$unwind:"$user"},

            {$lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank" }},
            {$unwind:{path:"$bank",preserveNullAndEmptyArrays: true}}
        );

        if(queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.PENDING.toUpperCase()
            && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.IN_PROGRESS.toUpperCase()
            && queryParam.status.toUpperCase() !== constants.ADVICE_STATUS_CATEGORIES.REJECTED.toUpperCase()) {
            if( (queryParam.statusType !== constants.DOWNLOAD_FILE_TYPE.ALL_EXCEL) && limit) {
                aggregateQuery.push( { $limit : apiUtils.getExternalConfigFile().maxDownloadLimit });
            }
            aggregateQuery.push(
                {$lookup: { from: "users", localField: "secondLevelApprover", foreignField: "_id", as: "secondLevelApprover" }},
                {$unwind:"$secondLevelApprover"},

                {$lookup: { from: "users", localField: "thirdLevelApprover", foreignField: "_id", as: "thirdLevelApprover" }},
                {$unwind:"$thirdLevelApprover"},

                {$lookup: { from: "users", localField: "disburser", foreignField: "_id", as: "disburser" }},
                {$unwind:"$disburser"},
                {
                    $group : {_id : {project: "$project"},
                        projectDetails:
                        { $addToSet :
                        {
                            "name": "$project",
                            "requestedAmount": "$requestedAmount",
                            "adviceStatus": "$adviceStatus",
                            "adviceNumber": "$adviceNumber",
                            "payee": "$payee",
                            "ledger":"$ledger",
                            "category":"$category",
                            "type": "$type",
                            "paymentType": "$paymentType",
                            "user": {
                                "_id":"$user._id",
                                "firstName":"$user.firstName",
                                "lastName":"$user.lastName"
                            },
                            "bank": "$bank",
                            "disburserDate": "$disburserDate",
                            "secondLevelApprover":{
                                "_id":"$secondLevelApprover._id",
                                "firstName":"$secondLevelApprover.firstName",
                                "lastName":"$secondLevelApprover.lastName"
                            } ,
                            "thirdLevelApprover": {
                                "_id":"$thirdLevelApprover._id",
                                "firstName":"$thirdLevelApprover.firstName",
                                "lastName":"$thirdLevelApprover.lastName"
                            },
                            "disburser": {
                                "_id":"$disburser._id",
                                "firstName":"$disburser.firstName",
                                "lastName":"$disburser.lastName"
                            },
                            "initiatedBy": "$initiatedBy",
                            "chequeNumber": "$chequeNumber",
                            "creditCardNumber": "$creditCardNumber",
                            "debitCardNumber": "$debitCardNumber",
                            "description": "$description",
                            "billAmountDue": "$billAmountDue",
                            "requestedBy":"$requestedBy",
                            "id": "$_id"
                        }},
                        total : { $sum : "$requestedAmount" }}
                });
        }
        else {
            aggregateQuery.push(
                {
                    $group : {_id : {project: "$project"},
                        projectDetails:
                        { $addToSet :
                        {
                            "name": "$project",
                            "requestedAmount": "$requestedAmount",
                            "adviceStatus": "$adviceStatus",
                            "adviceNumber": "$adviceNumber",
                            "payee": "$payee",
                            "ledger":"$ledger",
                            "category":"$category",
                            "type": "$type",
                            "paymentType": "$paymentType",
                            "user": {
                                "_id":"$user._id",
                                "firstName":"$user.firstName",
                                "lastName":"$user.lastName"
                            },
                            "bank": "$bank",
                            "disburserDate": "$disburserDate",
                            "initiatedBy": "$initiatedBy",
                            "chequeNumber": "$chequeNumber",
                            "creditCardNumber": "$creditCardNumber",
                            "debitCardNumber": "$debitCardNumber",
                            "description": "$description",
                            "billAmountDue": "$billAmountDue",
                            "requestedBy":"$requestedBy",
                            "id": "$_id"
                        }},
                        total : { $sum : "$requestedAmount" }}
                }
            );
        }
        return aggregateQuery;
    },
    prepareAggregationQueryForProjectMatrix: function(queryParam, organizationId) {
        var query   = apiUtils.prepareSearchQuery(queryParam, organizationId);
        var aggregateQuery = [];
        var matchParams = apiUtils.getMatchParams(query);

        aggregateQuery.push({ $match: {$and: matchParams}});

        aggregateQuery.push(
            {$lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" }},
            {$unwind:"$project"}
        );
        aggregateQuery.push(
            {
                $group : {_id : {year:{$substr: ['$disburserDate', 0, 7]},project: '$project._id'},
                    details: {
                        $addToSet: {
                            reqAmount: '$requestedAmount',
                            projectName:'$project.projectName',
                            disburseDate:'$disburserDate'
                        }
                    },
                    totalAmt: { "$sum": '$requestedAmount' }}
            }
        );
        return aggregateQuery;

    },
    totalAmountQueryPerProject:function(queryParam, organizationId, limit){
        var query = {};
        if(queryParam.status === constants.ADVICE_STATUS_CATEGORIES.DISBURSED){
            query   = apiUtils.prepareSearchQuery(queryParam, organizationId);
        }
        else {
            query.organization =  mongoose.Types.ObjectId(queryParam.organization.toString());
            query.adviceStatus = queryParam.adviceStatus;
        }
        var aggregateQuery = [];
        var date = {};
        var matchParams = apiUtils.getMatchParams(query);
        matchParams.push({'expired': false});
        aggregateQuery.push({ $match: {$and: matchParams}});
        if( (queryParam.statusType !== constants.DOWNLOAD_FILE_TYPE.ALL_EXCEL) && limit) {
            aggregateQuery.push( { $limit : apiUtils.getExternalConfigFile().maxDownloadLimit });
        }
        aggregateQuery.push({
            $group : {_id : null,
                totalAmount : { $sum : "$requestedAmount" }}
        },{$unwind:'$totalAmount'});
        return aggregateQuery;

    },
    preparePaymentHistorySearchQuery : function(queryParam, orginasationId){
        var query = {};
        var date = {};
        if(queryParam.toDate){
            var toDate = moment(queryParam.toDate).add(1, 'days').toDate();
        }
        if(queryParam.fromDate){
            var fromDate = moment(queryParam.fromDate).toDate();
        }
        if(queryParam.toDate) { date["$lt"] = toDate}
        if(queryParam.fromDate) { date["$gte"] = fromDate }
        if(queryParam.payee) {query["payee"] =  mongoose.Types.ObjectId(queryParam.payee.toString()) }
        query["adviceStatus"] = constants.ADVICE_APPROVE_STATUS_BY_ROLE.ROLE_DISBURSER;

        if (this.isEmptyObject(date)) {
            console.log('empty')
        }
        else {
            query["disburserDate"] = date;
        }
        query.organization =  mongoose.Types.ObjectId(orginasationId.toString());
        return query;

        return aggregateQuery;
    },
    getAllVersions: function(adviceNumber, orgId){
        var deferred = Q.defer();
        AdviceModel.aggregate(
            [
                { $match:  { "adviceNumber": adviceNumber, "organization": mongoose.Types.ObjectId(orgId)}},
                { $project: { "adviceNumber":1, "_id":1, "startDate": 1, "modifiedDate": 1,"version": 1 }}
            ], function(error, res){
                if (error){
                    deferred.reject(error);
                }
                deferred.resolve(res)
            });
        return deferred.promise;
    },
    prepareAggregationQueryForPaymentRequest:function(req,queryParam){
        var preparedQuery=[];
        if(queryParam.projectId && req.currentUser.roles.indexOf("ROLE_PAYMENT_REQUESTER")!==-1){
            preparedQuery.push({$match : {organization : req.currentUser.organization,
                requestedUser:mongoose.Types.ObjectId(req.currentUser._id)}});
        }
        else {
            preparedQuery.push({$match : {organization : req.currentUser.organization}});
        }
        preparedQuery.push(
            {$lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" }},
            {$unwind:"$project"},
            {$lookup: { from: "payees", localField: "payee", foreignField: "_id", as: "payee" }},
            {$unwind:"$payee"},
            {$lookup: { from: "users", localField: "payee.user", foreignField: "_id", as: "payee.user" }},
            {$unwind:"$payee.user"},
            {
                $group : {_id : {project: "$project"},
                    projectDetails:
                    { $addToSet :
                    {
                        name : '$project.projectName',
                        amount:'$amount',
                        status : "$status",
                        paymentRequestNumber : "$paymentRequestNumber",
                        payee:'$payee',
                        id:'$_id'
                    }},
                    total : { $sum : "$amount" }}
            });
        return preparedQuery;
    },
    /**
     * This method is used to prepare aggregation group query for downloadAll Payment Request
     * @param req
     * @param queryParam
     * @returns {Array}
     */
    prepareAggregationQueryForPaymentRequestByStatus:function(req,queryParam){
        var preparedQuery=[];
        if(queryParam.projectId && req.currentUser.roles.indexOf("ROLE_PAYMENT_REQUESTER")!==-1){
            preparedQuery.push({$match : {organization : req.currentUser.organization,
                project:mongoose.Types.ObjectId(queryParam.projectId.toString()),
                requestedUser:mongoose.Types.ObjectId(req.currentUser._id)}}
            );
        }
        else {
            preparedQuery.push({$match : {organization : req.currentUser.organization}});
        }

        //Here we are grouping the payment requests base on the payment request status and populating associate project,
        // payee and user with corresponding payment request. And as well calculating sum of amount total per status and projecting required fields.
        preparedQuery.push(
            {$lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" }},
            {$unwind:"$project"},
            {$lookup: { from: "payees", localField: "payee", foreignField: "_id", as: "payee" }},
            {$unwind:"$payee"},
            {$lookup: { from: "users", localField: "payee.user", foreignField: "_id", as: "payee.user" }},
            {$unwind:"$payee.user"},
            {
                $group : {_id : "$status",
                    projectDetails:
                    { $addToSet :
                    {
                        name : '$project.projectName',
                        status:"$status",
                        amount:'$amount',
                        paymentRequestNumber : "$paymentRequestNumber",
                        payeeUser:'$payee.user',
                        id:'$_id'
                    }},
                    total : { $sum : "$amount" }}
            },
            {
                $project: {
                    total: 1,
                    'projectDetails.payeeUser._id':1,
                    'projectDetails.payeeUser.firstName':1,
                    'projectDetails.payeeUser.middleName':1,
                    'projectDetails.payeeUser.lastName':1,
                    'projectDetails.name':1,
                    'projectDetails.status':1,
                    'projectDetails.amount':1,
                    'projectDetails.paymentRequestNumber':1,
                    'projectDetails.id':1
                }
            });
        return preparedQuery;
    },
    /**
     * Creates a new version for advice and deactivates existing advice
     * @param adviceId
     * @returns {*|promise}
     */
    createVersion: function(adviceId){
        var deferred = Q.defer();
        AdviceModel.findById(adviceId).then(function(advice){
            var versionedAdvice = JSON.parse(JSON.stringify(advice));
            versionedAdvice.version = apiUtils.getNextVersion(advice.version);
            versionedAdvice.isActive = true;
            versionedAdvice.amended = true;
            versionedAdvice.expired = false;
            delete versionedAdvice._id;
            adviceUtil.getAllVersions(advice.adviceNumber, advice.organization).then(function(projectedAdvices){
                versionedAdvice.revisions = projectedAdvices;
                var adviceModel = new AdviceModel(versionedAdvice);
                adviceModel.save(function(error, adviceInstance){
                    if (error) {
                        console.log("error", error);
                        deferred.reject(error);
                    }
                    if(adviceInstance){
                        //deactivate existing user
                        adviceUtil.deActivateAdvice(adviceInstance).then(function(response){
                            deferred.resolve(adviceInstance);
                        }, function(error){
                            console.log("error", error);
                            deferred.reject(error);
                        })
                    }
                });
            }, function(error){
                console.log("error", error);
                deferred.reject(error);
            })

        });
        return deferred.promise;
    },
    /**
     * deactivates existing advice
     * @param adviceId
     * @returns {*|promise}
     */
    deActivateAdvice: function(newAdvice) {
        var deferred = Q.defer();
        /*
         NOTE:AdviceNumber and organization took from newly created advice as these values are same as previous advices
         */
        var matchQuery = {
            "adviceNumber" :newAdvice.adviceNumber,
            "_id":{"$ne":mongoose.Types.ObjectId(newAdvice['_id'])},
            "isActive":true,
            "organization":mongoose.Types.ObjectId(newAdvice.organization)
        };
        AdviceModel.update(matchQuery, {"isActive":false, "expired":true}, {"multi":true}, function(err, response){
            if (err) { deferred.reject(err); }
            else { deferred.resolve("Previous advices are deactivated successfully"); }
        });
        return deferred.promise;
    },
    /**
     * activates existing advice
     * @param adviceId
     * @returns {*|promise}
     */
    activateAdvice: function(adviceId){
        var deferred = Q.defer();
        AdviceModel.findById(adviceId).then(function(advice){
            advice.isActive = true;
            advice.expired = false;
            advice.save(function(err, activatedAdvice){
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(activatedAdvice);
                }
            });
        });
        return deferred.promise;
    },
    /**
     * Hard deletes existing advice
     * @param adviceId
     * @returns {*|promise}
     */
    deleteVersionedAdvice: function(adviceId){
        var deferred = Q.defer();
        AdviceModel.remove({ _id: adviceId }).then(function(err){
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve("success");
            }
        });
        return deferred.promise;
    },
    /**
     * Populates advice data from form data
     * @param advice
     * @param data
     * @returns {*|promise}
     */
    populateAdviceDetails: function(advice, data) {
        var deferred = Q.defer();
        try {
            //populate payee, payment type, category, project
            advice.payee = mongoose.Types.ObjectId(data.payee._id);
            advice.paymentType =data.paymentType ? mongoose.Types.ObjectId(data.paymentType) : null;
            advice.project = mongoose.Types.ObjectId(data.project._id);
            if (data.bank) {
                if(data.bank._id){
                    advice.bank = mongoose.Types.ObjectId(data.bank._id)
                }
                else {
                    advice.bank = mongoose.Types.ObjectId(data.bank)
                }
            }
            if(data.category){
                advice.category =mongoose.Types.ObjectId(data.category);
            }

            advice.requestedAmount = data.requestedAmount;
            advice.billAmountDue = data.billAmountDue;
            advice.type = data.type;
            advice.requestedBy = data.requestedBy;
            /*advice.urgent = data.urgent;*/
            advice.description = data.description ? data.description: "";
            advice.chequeNumber = data.chequeNumber ? data.chequeNumber : "";
            advice.creditCardNumber = data.creditCardNumber ? data.creditCardNumber : "";
            advice.debitCardNumber = data.debitCardNumber ? data.debitCardNumber : "";
            advice.accountNumber = data.accNo ? data.accNo : "";
            advice.disburserDate = data.disburserDate ? data.disburserDate : "";
            advice.ledger=data.ledger ? mongoose.Types.ObjectId(data.ledger._id) : null;
            advice.category =data.category ? mongoose.Types.ObjectId(data.category) : null;

            //populate source
            advice.others = data.others;
            deferred.resolve(advice);
        }
        catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    },
    prepareAggregationSearchQueryForGetAdviceCount: function(queryParam, organizationId) {
        var query = apiUtils.prepareSearchQuery(queryParam, organizationId);

        var aggregateQuery = [];
        var matchParams = apiUtils.getMatchParams(query);
        aggregateQuery.push({ $match: {$and: matchParams}});


        aggregateQuery.push(
            {$group : {_id : null, advicesCount: {$sum: 1}}}
        );

        return aggregateQuery;
    },
    getCounterValueOfY:function(index){
        var pdfYPosition=[260,275,290,305,320,335,350,365,380];
        return pdfYPosition[index++];
    },
    getVirtualLedgerPayees:function(id) {
        var deffered=Q.defer();
        virtualLedgerModel.findById({_id: id}).select('payees').exec(function (er, virtualLedger) {
            if (er) {
                deffered.reject()
            }
            else {
                var virtualLedgerPayees = [];
                virtualLedgerPayees = virtualLedger.payees.map(function (payeeId, index) {
                    return new mongoose.Types.ObjectId(payeeId)
                })
                deffered.resolve(virtualLedgerPayees)
            }
        });
        return deffered.promise;
    },
    getPayeesIdsOfVirtualLedger:function(virtualLedger){
        var deffered = Q.defer();
        if(virtualLedger) {
            adviceUtil.getVirtualLedgerPayees(virtualLedger).then(function (payees) {
                deffered.resolve(payees)
            }, function (reject) {
                deffered.reject()
            });
        }
        else{
            deffered.resolve("")
        }
        return deffered.promise;
    },
    getTotalProjectCount : function(aggQuery) {
        var deffered = Q.defer();
        var resultantObject = {}
        AdviceModel.aggregate(aggQuery).exec(function (error, projectCount) {
            if (error) {
                deferred.reject()
            }
            else if(projectCount!=null) {
                var resultantObject={}
                resultantObject.totalProjectCount=projectCount.length;
                deffered.resolve(resultantObject)
            }
            else {
                deffered.resolve(aggQuery)
            }
        });
        return deffered.promise
    },
    getLimitedAdvices:function (aggQuery,skip,limit) {
        var deffered = Q.defer();
        aggQuery = aggQuery.concat([{"$skip": skip}, {"$limit": limit}])
        AdviceModel.aggregate(aggQuery
            , function (err, advices) {
                if (advices) {
                    deffered.resolve(advices);
                }
                else {
                    deffered.reject(err);
                }
            })
        return deffered.promise
    },
    fetchAdvicesByLimit: function(aggQuery,groupBySkip,groupByLimit){
        var promises = [];
        var deferred=Q.defer()
        promises.push(adviceUtil.getTotalProjectCount(aggQuery));
        promises.push(adviceUtil.getLimitedAdvices(aggQuery, groupBySkip, groupByLimit));
        Q.allSettled(promises).then(function (resultant) {
            var responseObject = {}
            if (resultant) {
                responseObject.totalProjectCount = resultant[0].value.totalProjectCount;
                responseObject.advices = resultant[1].value;
                deferred.resolve(responseObject)
            }
            else {
                deferred.reject("error")
            }
        })
        return deferred.promise
    }
};
module.exports=adviceUtil;

/**
 * This method will update the comments in advice.
 * @param adviceId
 * @param commentArr
 * @returns {*|promise}
 */
function updateAdviceComments(adviceId,commentArr) {
    var deferred = Q.defer();
    AdviceModel.update({"_id": adviceId}, {$push:{comments:{$each:commentArr}}}, function (error, advice) {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(advice);
        }
    });
    return deferred.promise;
}