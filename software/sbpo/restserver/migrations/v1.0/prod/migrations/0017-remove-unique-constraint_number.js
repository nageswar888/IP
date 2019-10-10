/**
 * Created by praveen on 2/27/17.
 */
var mongodb = require('mongodb');
var Q = require('q');

exports.up = function(db, next){

    /*Collections*/
    var countersCollection = db.collection('counters');
    var payeeCollection = db.collection('payees');


    /*Drop unique index from payee collection for payeeNumber*/
    try {
        payeeCollection.dropIndex("payeeNumber_1");
    } catch (e) {
        console.log(e)
    }

    /*Update payeeNumber if exist to 8-digit unique number */
    var payeeNumber = 10000000;
    var defered = Q.defer();
    var bulk = db.collection('payees').initializeUnorderedBulkOp();
    payeeCollection.find({"payeeNumber":{"$exists":true}}).toArray(function(err, payeeList){
        if(payeeList.length != 0) {
            payeeList.forEach(function(payeeDoc, index){
                bulk
                    .find({"_id":payeeDoc['_id']})
                    .updateOne({"$set":{"payeeNumber":payeeNumber+index}});

                if(index == payeeList.length-1) {
                    bulk.execute(function(err, result) {
                        console.log("Bulk execution of payee number completed");
                        if(!err) { defered.resolve() }
                        else { defered.reject() }
                    })
                }
            })
        } else {
            countersCollection.insert({_id:'payee_seq', model:'Payee', seq:10000000},function(err, ids){
                console.log("Inserted payee_seq with payeeNumber 10000000");
                defered.reject();
                next();
            });
        }
    });

    defered.promise.then(function(){
        payeeCollection.aggregate([{"$group":{"_id":null, "maxPayeeNumber":{"$max":"$payeeNumber"}}}])
            .forEach(function(doc){
                /*Update OR insert payee_seq value by latest payeeNumber*/
                var counterPromiseObj = countersCollection.update({_id:'payee_seq', model:'Payee'},
                    {_id:'payee_seq', model:'Payee', seq:doc.maxPayeeNumber},
                    {upsert:true});
                counterPromiseObj.then(function(doc1){
                    console.log("Inserted payee_seq with latest payeeNumber");
                    next();
                });
            });
    });
};

exports.down = function(db, next){
    next();
};
