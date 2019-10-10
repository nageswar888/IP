var mongodb = require('mongodb');

exports.up = function(db, next) {
    var users = db.collection('users');
    users.update({'first_time_login':{'$exists':false}}, {'$set':{'first_time_login': true}}, {"multi":true})
        .then(function(){
            console.log('Added first_time_login filed to all users');
            next();
        })
};

exports.down = function(db, next){ next(); };