/**
 * Created by praveen on 3/22/17.
 */
var ErrorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var virtualLedgerModel = require('../../models/VirtualLedgerModal');
var adviceModel= require('../../models/AdviceModel');
var apiUtils = require('../../utils/apiUtils');
var Q = require('q');
var apiUtil=require('../../utils/apiUtils');
var mongoose = require('mongoose');


var virtualLedgerRoute = {
    list:function(req, res) {
        var org = req.currentUser.organization;
        var discriminator = req.query.ledgerType
        var populate = {path:'payees', select:'nickName'};
        virtualLedgerModel.find({organization: org, discriminator : discriminator}).sort({name:1}).populate(populate).exec(function(error, virtualLedgers){
            if(error) {
                res.send(new ErrorResult(503, apiUtil.i18n('failed.to.load.error.msg'), error))
            } else {
                res.send(new SuccessResponse(200, virtualLedgers, "", apiUtil.i18n('virtual.ledger.loaded.success.msg')));
            }
            res.end()
        })
    },
    save:function(req, res) {
        var queryParam = req.body.q;
        function builtMatchAndUpdateQuery(eachField) {
            var name = eachField.name || '';
            var nameRegex = name ? apiUtil.getMongoRegexMatch(name.trim()) : '';
            var updateQuery = {name:name, organization: req.currentUser.organization, discriminator: eachField.discriminator};
            var matchQuery = {name:nameRegex, organization: req.currentUser.organization, discriminator: eachField.discriminator};
            if(eachField.payees){
                updateQuery.payees = eachField.payees;
            }
            if(eachField['id']) { matchQuery['_id'] = {"$ne": eachField['id']}

            }
            return {"matchQuery": matchQuery, "updateQuery": updateQuery}
        }

        function checkDuplicateEntries(eachField) {
            var deferred = Q.defer()
            var queryData = builtMatchAndUpdateQuery(eachField);
            virtualLedgerModel.count(queryData.matchQuery, function(err, count){
                if(count == 0) {
                    deferred.resolve(apiUtil.i18n('duplicates.not.exists.success.msg'));
                } else {
                    deferred.reject(apiUtil.i18n('duplicates.exists.error.msg'));
                }
            });
            return deferred.promise;
        }
        var allPromises = [];
        queryParam.forEach(function(eachField,index){
            /*Converting string to ObjectId*/
            if(eachField.payees){
                eachField.payees = eachField.payees.map(function(payeeId, index){ return new mongoose.Types.ObjectId(payeeId) });
            }
            var promiseObj = checkDuplicateEntries(eachField);
            allPromises.push(promiseObj)
        });
        var updateDeferred = Q.defer();
        Q.allSettled(allPromises)
            .then(function (results) {
                var rejectedData = results.find(function(entry) { return entry.state !== 'fulfilled' });
                if(rejectedData) {
                    updateDeferred.reject("Duplicate")
                } else if(queryParam[0].discriminator === "virtualLedger"){
                    var aggregateQuery=[
                        {"$match":{"discriminator" : "virtualLedger"}},
                        {"$project":{"payees": 1}},
                        {"$unwind":"$payees"},
                        {"$group":{"_id":null, "payees":{"$push":"$payees"}}}
                    ];
                    var isPayeeValid = true;
                    virtualLedgerModel.aggregate(aggregateQuery,function (err2,resultPayees) {
                        if (err2) {
                            res.send(new ErrorResult(409, "failed", err));
                        }
                        else if (resultPayees.length !== 0) {
                            var payeesList = [];
                            queryParam.forEach(function (eachField, index) {
                                payeesList = payeesList.concat(eachField.payees.map(function (payee) {
                                    return payee
                                }));
                            });
                            var resultant = resultPayees[0].payees.toString();
                            for (var i = 0; i < payeesList.length; i++) {
                                for (var j = 0; j < resultPayees[0].payees.length; j++) {
                                    var eachPayee = payeesList[i].toString()
                                    if (i === j) {
                                        if (resultant[i] === eachPayee) {
                                            isPayeeValid = true
                                        }
                                    }
                                    if(resultant[j] === eachPayee){
                                        isPayeeValid = false;
                                        break;
                                    }
                                }
                            }

                        }
                        if (isPayeeValid || resultant.length == 0) {
                            bulkOperations()
                        }
                        else {
                            updateDeferred.reject('Duplicate')
                        }

                    });
                }
                else{
                    bulkOperations();
                }
            });
        function bulkOperations(){
            var bulk = virtualLedgerModel.collection.initializeOrderedBulkOp();
            queryParam.forEach(function(eachField, index){
                var queryData = builtMatchAndUpdateQuery(eachField);
                if(queryData.matchQuery['_id'])  {
                    var id = queryData.matchQuery['_id']['$ne'];
                    queryData.matchQuery = {};
                    queryData.matchQuery['_id'] = new mongoose.Types.ObjectId(id);
                }
                bulk
                    .find(queryData.matchQuery)
                    .upsert()
                    .updateOne(queryData.updateQuery);
            });
            bulk.execute(function(error, result) {
                if(error) {
                    updateDeferred.reject(error)
                } else {
                    updateDeferred.resolve(result)
                }
            });
        }
        updateDeferred.promise.then(function() {
            res.send(new SuccessResponse(200, '', "", "success"));
            res.end();
        }, function(err) {
            res.send(new ErrorResult(409, "failed",err));
        });
    },
    delete:function(req, res) {

        adviceModel.findOne({'ledger': req.query.id}, function (err, advice) {
            if (advice) {
                return res.json(new ErrorResult(403, apiUtils.i18n('ledger.delete.contains.advice.error.msg'), [err]))
            }
            else if (err) {
                return res.json(new ErrorResult(503, apiUtils.i18n('general.error.msg'), [err]))
            }
            else {
                virtualLedgerModel.remove({_id: req.query.id}, function (err, virtualLedger) {
                    if (err) {
                        return res.send(new ErrorResult(503, apiUtils.i18n('general.error.msg')));
                    }
                    else {
                        return res.send(new SuccessResponse(200, {}, "", apiUtils.i18n('virtual.ledger.delete.success.msg')));
                    }
                })
            }
        })
    },
    listByName:function(req,res){
        var searchTerm = (req.query.name||'');
        var populate = {path:'payees', select:'nickName'};
        var query={};
        query.organization = req.currentUser.organization;
        query.name = new RegExp(searchTerm, 'i');
        query.discriminator=req.query.type;
        if(searchTerm) {
            virtualLedgerModel.find(query, {'name':1}).exec(function(error, virtualLedgers){
                if(error) {
                    res.send(new ErrorResult(503, 'Failed to load', error))
                } else {
                    res.send(new SuccessResponse(200, virtualLedgers, "", "Virtual ledgers loaded successfully"));
                }
                res.end()
            });
        }else{
            res.end()
            //res.send(new ErrorResult(503, 'No search item', error))
        }
    },
    ledgerByName:function(req,res){
        var query={};
        query.organization = req.currentUser.organization;
        query.name = req.query.name;
        query.discriminator=req.query.discriminator;
        virtualLedgerModel.findOne(query).exec(function(error,ledger){
            if(error){
                res.send(new ErrorResult(503,'no ledger found',error))
            }
            else{
                console.log(ledger)
                res.send(new SuccessResponse(200,ledger,"","ledger loaded successfully "))
            }
        });
    }
};

module.exports = virtualLedgerRoute;