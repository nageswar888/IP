var mongodb = require('mongodb');
exports.up = function(db, next){
    db.collection('customFields').createIndex({ name: 1, organization: 1, type: 1 }, { unique: true });
    console.log('Created unique index on customField, organization and type ...');
    next();
};

exports.down = function(db, next){
    next();
};
