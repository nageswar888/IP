var mongodb = require('mongodb');
exports.up = function(db, next){
    var adviceCollection = db.collection('advices');
    adviceCollection.aggregate([
        {"$unwind":"$revisions"},
        {"$lookup":{from:"advices", localField: "revisions._id", foreignField: "_id", as: "linked_advice"}}
    ],function(err,advices){
        if(advices.length == 0) {
            console.log("advices not find")
            next();
        } else {
            advices.forEach(function(advice,index){
                if(advice){
                    adviceCollection.update(
                        {"_id":advice._id,"revisions._id":advice.revisions._id},
                        {'$set':{'revisions.$.version': advice.linked_advice[0].version }},
                        {upsert: true}
                    );
                } else {
                    console.log("Error",err);
                }
                if(index == advices.length-1) {
                    next();
                }
            })
        }
    });
};

exports.down = function(db, next){
    next();
};
