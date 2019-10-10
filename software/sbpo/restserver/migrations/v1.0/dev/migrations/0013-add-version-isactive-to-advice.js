var mongodb = require('mongodb');
exports.up = function(db, next){
    var adviceCollection = db.collection('advices')
    console.log('Migrating the advices');
    adviceCollection.update({}, { $set: {"version" : "1.0", "isActive": true, "revisions":[]}}, {"multi": true});
    next()
};

exports.down = function(db, next){
    next();
};
