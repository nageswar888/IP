var errorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var notificationModel= require('../../models/notificationModel');
var manageNotificationModel= require('../../models/manageNotificationModele');
var ErrorResult = require('../../models/ErrorResult');
var apiUtil=require('../../utils/apiUtils');
var Q = require('q');
var mongoose= require('mongoose');

var notificationRoute = {
    addContact: function (req,res) {
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var fields=queryParam.fields;
        var tempCount=0;

        function builtMatchAndUpdateQuery(eachField) {
            var contact = eachField.contact ? eachField.contact.toLowerCase() :'';
            var query = {type:queryParam.type, contact:contact, organization: req.currentUser.organization};
            var matchQuery = Object.assign({}, query);
            if(eachField['_id']) { matchQuery['_id'] = {"$ne": eachField['_id']} }
            return {"matchQuery": matchQuery, "updateQuery": query}
        }

        function checkDuplicateEntries(eachField) {
            var deferred = Q.defer();
            var queryData = builtMatchAndUpdateQuery(eachField);
            notificationModel.count(queryData.matchQuery, function(err, count){
                if(count == 0) {
                    deferred.resolve(apiUtil.i18n('duplicates.not.exists.success.msg'));
                } else {
                    deferred.reject(apiUtil.i18n('duplicates.exists.error.msg'));
                }
            });
            return deferred.promise;
        }
        var allPromises = [];
        fields.forEach(function(eachField,index){
            var promiseObj = checkDuplicateEntries(eachField);
            allPromises.push(promiseObj)
        });

        var updateDeferred = Q.defer();
        Q.allSettled(allPromises)
            .then(function (results) {
                var rejectedData = results.find(function(entry) { return entry.state !== 'fulfilled' });
                if(rejectedData) {
                    updateDeferred.reject("Duplicate")
                } else {
                    var bulk = notificationModel.collection.initializeOrderedBulkOp();
                    fields.forEach(function(eachField, index){
                        var queryData = builtMatchAndUpdateQuery(eachField);
                        if(queryData.matchQuery['_id'])  {
                            var id = queryData.matchQuery['_id']['$ne'];
                            queryData.matchQuery = {};
                            queryData.matchQuery['_id'] = new mongoose.Types.ObjectId(id);
                        }
                        bulk
                            .find(queryData.matchQuery)
                            .upsert()
                            .updateOne(queryData.updateQuery)
                    });
                    bulk.execute(function(error, result) {
                       if(error) {
                           updateDeferred.reject(error)
                       } else {
                           updateDeferred.resolve(result)
                       }
                    });
                }
            });
        updateDeferred.promise.then(function() {
            res.send(new SuccessResponse(200, '', "", apiUtil.i18n('request.success.msg')));
            res.end();
        }, function(err) {
            res.send(new errorResult(409, apiUtil.i18n('request.failed.msg'),err));
        });
    },
    deleteEmailId:function(req,res){
        notificationModel.findOne({_id:req.params.id},function(err,contactDetail){
            if(contactDetail){
                notificationModel.remove({_id:req.params.id},function(err,contactDetail){
                    if(err){
                        return res.send(new ErrorResult('FAILED', apiUtil.i18n('notification.delete.error.msg')));
                    }
                    else {
                        return res.send(new SuccessResponse('OK', contactDetail, "", apiUtil.i18n('notification.user.email.delete.success.msg')));
                    }
                })
            }
            else{
                return res.send(new ErrorResult('FAILED', apiUtil.i18n('notification.user.email.not.exists.error.msg')));
            }
        });

    },
    deleteMobileNo:function(req,res){
        notificationModel.findOne({_id:req.params.id},function(err,contactDetail){
            if(contactDetail){
                notificationModel.remove({_id:req.params.id},function(err,contactDetail){
                    if(err){
                        return res.send(new ErrorResult('FAILED', apiUtil.i18n('notification.delete.error.msg')));
                    }
                    else {
                        return res.send(new SuccessResponse('OK', contactDetail, "", apiUtil.i18n('notification.user.phone.delete.success.msg')));
                    }
                })
            }
            else{
                return res.send(new ErrorResult('FAILED', apiUtil.i18n('notification.user.phone.not.exists.error.msg')));
            }
        });

    },
    changeStatus:function(req,res){
        var queryParam=req.body;
        manageNotificationModel.findOne({type:queryParam.type},function(err,data){
            if(err){
                return res.send(new ErrorResult('FAILED', apiUtil.i18n('notification.delete.error.msg')));
            }
            else{
                if(queryParam.isEmail===undefined){
                    queryParam.isEmail='';
                }
                if(queryParam.isPhone===undefined){
                    queryParam.isPhone='';
                }
                if(!data){
                    new manageNotificationModel({
                        type:queryParam.type,
                        is_email:queryParam.isEmail,
                        is_phone:queryParam.isPhone,
                        organization:req.currentUser.organization
                    }).save(function(err,savenotification){
                        if(err){
                            return res.send(new ErrorResult('FAILED', apiUtil.i18n('request.failed.msg')));
                        }
                        else {
                            return res.send(new SuccessResponse('OK', savenotification, "", apiUtil.i18n('request.success.msg')));
                        }
                    })
                }
                else{
                    if(queryParam.isEmail===undefined){
                        queryParam.isEmail='';
                    }
                    if(queryParam.isPhone===undefined){
                        queryParam.isPhone='';
                    }
                    manageNotificationModel.update({type:queryParam.type},
                        {
                            is_email:queryParam.isEmail,
                            is_phone:queryParam.isPhone
                        },
                        function(err,notification){
                            if(err){
                                return res.send(new ErrorResult('FAILED', apiUtil.i18n('notification.delete.error.msg')));
                            }
                            else{
                                return res.send(new SuccessResponse('OK', notification, "", apiUtil.i18n('notification.update.success.msg')));
                            }

                        })
                }
            }


        })
    },
    listManageNotification:function(req,res){
        manageNotificationModel.find(function(err,notifications){
            if(err){
                return res.send(new ErrorResult('FAILED', apiUtil.i18n('request.failed.msg')));
            }
            else{
                return res.send(new SuccessResponse('OK', notifications, "", apiUtil.i18n('notification.update.success.msg')));
            }
        });
    },
    getEmailIds: function (req,res) {
        notificationModel.find({ $and: [{"type" : "email"},{"organization" : req.currentUser.organization}] },{contact:1},function(err,emails){
            if(err){
                return res.send(new ErrorResult('FAILED', apiUtil.i18n('request.failed.msg')));
            }
            else{
                return res.send(new SuccessResponse('OK', emails, "", apiUtil.i18n('notification.update.success.msg')));
            }
        })
    },
    getMobileNo:function(req,res){
        notificationModel.find({ $and: [{"type" : "mobile"},{"organization" : req.currentUser.organization}] },{contact:1},function(err,mobils){
            if(err){
                return res.send(new ErrorResult('FAILED', apiUtil.i18n('request.failed.msg')));
            }
            else{
                return res.send(new SuccessResponse('OK', mobils, "", apiUtil.i18n('notification.update.success.msg')));
            }
        })
    },
    editContact:function(req,res){
        var queryParam=req.body;
        notificationModel.update({contact : queryParam.previous},{
            contact:queryParam.contact
        },function(err,data){
            if(err){
                return res.send(new ErrorResult(404 , apiUtil.i18n('request.failed.msg')));
            }
            else {
                return res.send(new SuccessResponse(200, data, "", apiUtil.i18n('notification.update.success.msg')));
            }
        },{upsert:true});
    }
};

module.exports = notificationRoute;

