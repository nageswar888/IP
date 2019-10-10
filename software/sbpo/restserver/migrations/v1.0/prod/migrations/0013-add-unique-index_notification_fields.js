var mongodb = require('mongodb');
exports.up = function(db, next){
    db.collection('notifications').createIndex({ contact: 1, organization: 1, type: 1 }, { unique: true });
    console.log('Created unique index on notification fields ...');
    next();
};

exports.down = function(db, next){
    next();
};
