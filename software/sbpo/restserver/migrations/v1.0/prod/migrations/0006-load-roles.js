var passwordHash = require('password-hash');

exports.up = function(db, next){
    var roles = ['ROLE_INITIATOR', 'ROLE_LEVEL2APPROVER', 'ROLE_LEVEL3APPROVER', 'ROLE_DISBURSER',
            'ROLE_MASTERADMIN', 'ROLE_VIEWER', 'ROLE_IPASS_MASTERADMIN', 'LEGACY_DATA_OPERATOR',
        'ROLE_PAYEE', 'ROLE_PAYMENT_REQUESTER'];

    var rolesCollection = db.collection('roles');
    roles.forEach(function(role, index) {
        rolesCollection.findOne({name: role}, function(error, roleIns){
            if(!roleIns){
                rolesCollection.insertOne({name: role}, function(error, newRole){
                    if (index === roles.length-1) {
                        console.log("Loaded all roles");
                        next();
                    }
                })
            }
        })
    });
    if (roles.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
