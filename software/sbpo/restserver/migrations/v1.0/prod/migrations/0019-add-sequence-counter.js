/**
 * Created by praveen on 3/24/17.
 */
var mongodb = require('mongodb');

exports.up = function(db, next) {

    /*Collections*/
    var adviceCollection = db.collection('advices');

    /*====================================================For advice=====================================================*/
    var adviceBulk = adviceCollection.initializeUnorderedBulkOp();
    adviceCollection.aggregate(
        [
            {"$match":{"seq":{"$exists":false}}},
            {"$group":{"_id":"$organization", "advicesIds":{"$addToSet":"$_id"}, "count":{"$sum":1}}}
        ]
    ).toArray(function(err, result){
        result.forEach(function(groupData){
            console.log("Organization: "+groupData['_id']);
            var allPromises = [];
            console.log('Migrating Advices sequences...',groupData.advicesIds.length);
            groupData.advicesIds.forEach(function(id, index){
                console.log('Migrating '+index +' Advice: ', id);
                adviceBulk.find({"_id":id}).update({"$set":{"seq":index+1}});
                if(index === groupData.advicesIds.length-1) {
                    adviceBulk.execute(function(error, result) {
                        if(error) {
                            console.log('Failed while migration the advices sequences: ',error);
                        } else {
                            console.log('Migrated Advices sequences.');
                            next();
                        }
                    })
                }
            });
        });
    });
};

exports.down = function(db, next){
    next();
};