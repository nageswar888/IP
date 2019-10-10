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
                        payeeCollection.update({_id:payee._id}, { $set: {"nickName" :user.firstName.replace(/ /g, '').replace(/\(/g,'').replace(/\)/g,'').replace(/\//g,'.').replace(/\\/g,'').trim()+" "+user.lastName.replace(/\(/g,'').replace(/\)/g,'').replace(/\//g,'').replace(/\\/g,'').trim()}}, {"multi": false});
                        console.log("count", count);
                    }
                    if(count === payeeCount) {
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
