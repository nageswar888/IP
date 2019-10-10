var CustomFieldModel= require('../../models/CustomFieldsModel');
var errorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var apiUtil=require('../../utils/apiUtils');
var customFieldUtils=require('../../utils/customFieldUtils');
var AdviceModel= require('../../models/AdviceModel');
var PaymentRequestModel= require('../../models/PaymentRequestModel');
var mongoose= require('mongoose');
var Q = require('q');

var customFieldRouter = {
    saveCustomField: function(req,res){
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var type=apiUtil.getCustomType(queryParam.type);
        var fields=queryParam.fields;

        function builtMatchAndUpdateQuery(eachField) {
            var name = eachField.name || '';
            var nameRegex = name ? apiUtil.getMongoRegexMatch(name.trim()) :'';

            var updateQuery = {type:type, name:name, organization: req.currentUser.organization, description: eachField.description};
            var matchQuery = {type:type, name:nameRegex, organization: req.currentUser.organization};
            if(eachField['id']) { matchQuery['_id'] = {"$ne": eachField['id']} }

            return {"matchQuery": matchQuery, "updateQuery": updateQuery}
        }

        function checkDuplicateEntries(eachField) {
            var deferred = Q.defer();
            var queryData = builtMatchAndUpdateQuery(eachField);
            CustomFieldModel.count(queryData.matchQuery, function(err, count){
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
                    var bulk = CustomFieldModel.collection.initializeOrderedBulkOp();
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
    listCustomFields: function(req,res){
        var type=apiUtil.getCustomType(req.params.type);
        var query = {
            organization: req.currentUser.organization,
            type: type
        }
        CustomFieldModel.find(query).sort({name:1}).exec(function (err, customFields) {
            if (err) {
                res.send(new errorResult('ERROR', apiUtil.i18n('request.failed.msg'),err));
            } else {
                res.send(new SuccessResponse('OK', apiUtil.marshalCustomFields(customFields), "", apiUtil.i18n('request.success.msg')));
                res.end();
            }
        })
    },
    deleteCustomField: function(req, res) {
        var query={};
        CustomFieldModel.findOne({_id :req.params.id},function(error,result){
            if(result){
                if(result.type==apiUtil.getCustomType('Category')){
                    query = {"category": result._id , expired: false}
                }else{
                    query = {"paymentType": result._id , expired: false}
                }
                AdviceModel.findOne(query, function (err, advice) {
                    if (advice) {
                        return res.json(new errorResult(503, apiUtil.i18n('custom.field.delete.advice.exist.error.msg'), [err]))
                    } else {
                        if(result.type === apiUtil.getCustomType('PaymentType')){
                            PaymentRequestModel.findOne({"paymentType": result._id},function(err,data){
                                if(data){
                                    return res.json(new errorResult(503, apiUtil.i18n('custom.field.delete.payment.type.exist.error.msg'), [err]))
                                }
                                else {
                                    customFieldUtils.removeCustomField(req.params.id).then(function(success){
                                        return res.json(new SuccessResponse(200, {}, {}, success));
                                    },function(failed){
                                        return res.json(new errorResult(404, apiUtil.i18n('custom.field.delete.error.msg'), failed))
                                    });
                                }
                            })

                        }
                        else {
                            customFieldUtils.removeCustomField(req.params.id).then(function(success){
                                return res.json(new SuccessResponse(200, {}, {}, success));
                            },function(failed){
                                return res.json(new errorResult(404, apiUtil.i18n('custom.field.delete.error.msg'), failed))
                            })
                        }
                    }
                });
            }else{
                console.log('custom field not found');
            }

        });
    },
    editCustomField: function(req, res) {
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        var type=apiUtil.getCustomType(queryParam.type);
        CustomFieldModel.findOne({name:{ $regex : new RegExp(queryParam.name, "i")}, organization: req.currentUser.organization ,type:type, _id:{$ne: req.params.id}},function(err,result){
            if(!result){
                CustomFieldModel.update(
                    { _id: req.params.id },
                    {
                        name : queryParam.name,
                        value : apiUtil.getCustomTypeValue(queryParam.name),
                        description : queryParam.description,
                        type : type
                    },
                    { upsert: true },function(error,data){

                        if(error){
                            res.send(new errorResult('ERROR', apiUtil.i18n('request.failed.msg'),error));
                        }

                        else {
                            res.send( new SuccessResponse('OK', data, "", apiUtil.i18n('request.success.msg')) );
                        }

                    }
                );
            }else{
                res.send(new errorResult(409, apiUtil.i18n('custom.field.exists.error.msg'),err));
            }
        })
    }
};
module.exports = customFieldRouter;
