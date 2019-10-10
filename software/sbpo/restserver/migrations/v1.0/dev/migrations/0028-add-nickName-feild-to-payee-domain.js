var mongodb = require('mongodb');
var Q = require('q');

exports.up = function(db, next){
    var payeeCollection = db.collection('payees');
    var userCollection = db.collection('users');
    var count = 1;

    console.log('Migrating the payee');
    payeeCollection.count({}, function(error,payeeCount) {
        payeeCollection.find().forEach(function(payee){
            console.log("Payee", payee._id);
            userCollection.findOne({_id:payee.user},{ firstName: 1, lastName: 1 },function(err,user){
                if(err){
                    console.log("Error", err);
                }
                else {
                    if(user) {
                        payeeCollection.update({_id:payee._id}, { $set: {"nickName" :user.firstName+" "+user.lastName}}, {"multi": false});
                    }
                    if(count === payeeCount) {
                        console.log("Limit reached:", count);
                        next();
                    }
                    count++;
                }
            })
        });
    })
};

exports.down = function(db, next){
    next();
};
