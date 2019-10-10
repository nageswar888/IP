exports.up = function(db, next){
    /*Collections*/
    var userCollection = db.collection('users');
    var payeeCollection = db.collection('payees');

    /*Disable expired payees*/
    payeeCollection.find({expired:true}, {"user":1}).toArray(function(error, payees){
        var userIds = payees.map(function(elem){return elem.user;});
        userCollection.update({"_id":{"$in":userIds}}, {"$set":{"enabled":false}},{"multi":true}, function(err, result){
            if(!err) {
                console.log("---Disabled expired payees successfully---");
                next();
            }
        });
    });
};
exports.down = function(db, next){
    next();
};
