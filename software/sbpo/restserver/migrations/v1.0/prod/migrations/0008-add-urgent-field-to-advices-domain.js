var mongodb = require('mongodb');

exports.up = function(db, next){
    var advices = db.collection('advices');
    var adviceCount = 0, i=1;
    advices.count({}).then(function (count) {
        adviceCount = count;
        if (count>0) {
            advices.find({}).forEach(function (advice, index) {
                advices.update({_id: advice._id},{ $set: {"urgent" : false}});
                if(i===adviceCount) {
                    console.log('Migrated all advices');
                    next();
                }
                i++;
            });
        } else {
            next();
        }
    })
};

exports.down = function(db, next){
    next();
};

