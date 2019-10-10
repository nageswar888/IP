var mongodb = require('mongodb');
exports.up = function(db, next){
    var users = db.collection('users');
    var organizations = db.collection('organizations');
    organizations.findOne({name: 'DCL'},function(err,organization){
        console.log('updating for organization...',organization._id);
        users.findOne({organization: organization._id, roles: "ROLE_MASTERADMIN"}, function(err,user){
            if(user) {
                organizations.update({_id: organization._id},{ $push: {"admins" : user._id}},{multi:true});
                setTimeout(function(){
                    console.log('Migrated super admins for DCL...');
                    next();
                },500);
            }
        });
    });
};

exports.down = function(db, next){
    next();
};
