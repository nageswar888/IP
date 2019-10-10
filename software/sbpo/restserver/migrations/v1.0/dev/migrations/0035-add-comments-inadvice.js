/**
 * Created by praveen on 4/17/17.
 */
var mongodb = require('mongodb');
var Q = require('q');

exports.up = function(db, next){
    /*Collections*/
    var adviceCollection = db.collection('advices');
    var commentCollection = db.collection('comments');

    var allPromises = [];
    commentCollection.aggregate([
        {"$match":{"advice":{"$exists":true}}},
        {"$group":{"_id":"$advice", "comments":{"$addToSet":"$_id"}}}
    ]).forEach(function(doc) {
        if(doc._id && doc.comments) {
            allPromises.push(adviceCollection.update({"_id":doc._id},{"$set":{"comments":doc.comments}}))
        }
    });

    Q.allSettled(allPromises)
        .then(function (results) {
            commentCollection.update({"advice":{"$exists":true}}, {"$unset":{"advice":""}}, {"multi":true})
                .then(function(result){
                    console.log('Successfully assigned comment to advice');
                    next();
                })
        }, function(error) {
            console.log('Error occured while assigning comments to advice');
        });
};

exports.down = function(db, next){
    next();
};
