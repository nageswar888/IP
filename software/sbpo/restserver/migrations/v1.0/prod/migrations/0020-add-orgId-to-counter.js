/**
 * Created by praveen on 2/28/17.
 */

var mongodb = require('mongodb');
var Q = require('q');
var constants = require('../../../../utils/constants');

exports.up = function(db, next){

    /*Collections*/
    var countersCollection = db.collection('counters');
    var payeeCollection = db.collection('payees');
    var adviceCollection = db.collection('advices');
    var paymentRequestCollection = db.collection('paymentRequests');

    /*Drop unique index from payee collection for payeeNumber*/
    try {
        countersCollection.dropIndex("model_1");
    } catch (e) {
        console.log(e)
    }

    /*=========================================For payee===========================================*/
    var payeeBulk = countersCollection.initializeUnorderedBulkOp();
    var payeeCounterDefered = Q.defer();
    payeeCollection.aggregate([{"$group":{"_id":"$organization", "maxPayeeNumber":{"$max":"$payeeNumber"}}}]).toArray(function(err, payeeList){
        if(payeeList.length != 0) {
            payeeList.forEach(function(payeeDoc, index){
                payeeBulk
                    .find({model:'Payee', organization:payeeDoc['_id']})
                    .upsert()
                    .update({"$set":{model:'Payee', organization:payeeDoc['_id'], seq:payeeDoc.maxPayeeNumber}});

                if(index == payeeList.length-1) {
                    payeeBulk.execute(function(err, result) {
                        console.log("Bulk execution of payee counter completed");
                        if(!err) { payeeCounterDefered.resolve() }
                        else { payeeCounterDefered.reject() }
                    })
                }
            })
        } else {
            payeeCounterDefered.resolve()
        }
    });
    payeeCounterDefered.promise.then(function(){
        console.log("Updated/Inserted payee counters")
    });

    /*====================================================For advice=====================================================*/
    var adviceBulk = countersCollection.initializeUnorderedBulkOp();
    var adviceCounterDefered = Q.defer();
    adviceCollection.aggregate(
        [
            {"$group":{"_id":"$organization", "maxSeqVal":{"$max":"$seq"}}},
            {"$lookup": { "from": "organizations", "localField": "_id", "foreignField": "_id", as: "organization" }},
            {"$unwind":"$organization"},
            {"$project":{"maxSeqVal":1, "organization.code":1}}
        ]
    ).toArray(function(err, adviceList){
        if(adviceList.length != 0) {
            adviceList.forEach(function(adviceDoc, index){
                adviceBulk
                    .find({model:'Advice', organization:adviceDoc['_id']})
                    .upsert()
                    .update({"$set":{model:'Advice', organization:adviceDoc['_id'], seq:adviceDoc.maxSeqVal}});

                if(index == adviceList.length-1) {
                    adviceBulk.execute(function(err, result) {
                        console.log("Bulk execution of advice counter completed");
                        if(!err) { adviceCounterDefered.resolve() }
                        else { adviceCounterDefered.reject() }
                    })
                }
            })
        } else {
            adviceCounterDefered.resolve()
        }
    });
    adviceCounterDefered.promise.then(function(){
        console.log("Updated/Inserted advice counters")
    });

    /*=====================================================For paymentRequest================================================*/
    var paymentRequestBulk = countersCollection.initializeUnorderedBulkOp();
    var paymentRequestCounterDefered = Q.defer();
    paymentRequestCollection.aggregate(
        [{"$group":{"_id":"$organization", "maxSeqVal":{"$max":"$pr_seq"}}}]
    ).toArray(function(err, paymentRequestList){
        if(paymentRequestList.length != 0) {
            paymentRequestList.forEach(function(paymentRequestDoc, index){
                paymentRequestBulk
                    .find({model:'PaymentRequest', organization:paymentRequestDoc['_id']})
                    .upsert()
                    .update({"$set":{model:'PaymentRequest', organization:paymentRequestDoc['_id'], seq:paymentRequestDoc.maxSeqVal}});

                if(index == paymentRequestList.length-1) {
                    paymentRequestBulk.execute(function(err, result) {
                        console.log("Bulk execution of paymentRequest counter completed");
                        if(!err) { paymentRequestCounterDefered.resolve() }
                        else { paymentRequestCounterDefered.reject() }
                    })
                }
            })
        } else {
            paymentRequestCounterDefered.resolve()
        }
    });
    paymentRequestCounterDefered.promise.then(function(){
        console.log("Updated/Inserted paymentRequest counters")
    });

    Q.allSettled([payeeCounterDefered.promise, adviceCounterDefered.promise, paymentRequestCounterDefered.promise])
        .then(function (results) {
            countersCollection.remove({"organization":{"$exists":false}},function(){
                console.log("Deleted all counters which does not have organixation");
                next();
            })
        });
};

exports.down = function(db, next){
    next();
};