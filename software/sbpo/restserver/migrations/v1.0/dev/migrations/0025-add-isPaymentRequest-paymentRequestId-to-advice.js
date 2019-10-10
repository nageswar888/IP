/**
 * Created by sb0103 on 17/3/17.
 */
var mongodb = require('mongodb');
exports.up = function(db, next){
    var adviceCollection = db.collection('advices');
    console.log('Migrating the advices');
    adviceCollection.update({}, { $set: {"isPaymentRequest" : false, "paymentRequestId": null}}, {"multi": true});
    next()
};

exports.down = function(db, next){
    next();
};

