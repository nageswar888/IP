
exports.up = function(db, next){
    console.log('Dropping phoneNumber and email indexes of the users table');
    db.collection('users').dropIndex({ "phoneNumber": 1 });
    db.collection('users').dropIndex({ "email": 1 });
    console.log('Dropped phoneNumber and email indexes');
    next();
};

exports.down = function(db, next){
    next();
};
