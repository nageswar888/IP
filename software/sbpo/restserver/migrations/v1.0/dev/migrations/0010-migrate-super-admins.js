var mongodb = require('mongodb');
exports.up = function(db, next){
    var users = db.collection('users');
    var organizations = db.collection('organizations');
    var orgs = [
        {name: 'SemanticBits', subDomain: 'admin', sector: 'Information Technology', code: 'SEM'},
        {name: 'Development', subDomain: 'dev', sector: 'Testing Environment', code: 'DEV'}
    ];
    orgs.forEach(function(orgDetails, index) {
        organizations.findOne({name: new RegExp(orgDetails['name'], "i")},function(err, organization){
            console.log('updating for organization...',organization._id);
            users.findOne({organization: organization._id, roles: "ROLE_MASTERADMIN"}, function(err,user){
                if(user) {
                    organizations.update({_id: organization._id},{ $push: {"admins" : user._id}},{multi:true});
                    if (index === orgs.length-1) {
                        console.log("Updated admins in organizations");
                        next();
                    }
                }
            });
        });
    });
};

exports.down = function(db, next){
    next();
};
