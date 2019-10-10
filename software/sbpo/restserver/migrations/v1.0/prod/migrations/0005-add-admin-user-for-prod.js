var passwordHash = require('password-hash');
var app = require('../../../../server');
var Q = require('q');

exports.up = function(db, next){
    var users = [
        {firstName: 'Sridhar', lastName: 'Thumma', email: 'sridhar.thumma@india.semanticbits.com', password: 'Password123',
            roles: ['ROLE_IPASS_MASTERADMIN'], orgName: 'SemanticBits', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9881455521'}
    ];
    var orgCollection = db.collection('organizations');
    var userCollection = db.collection('users');
    users.forEach(function(userDeails, index) {
        orgCollection.findOne({name: new RegExp(userDeails['orgName'], "i")}, function (error, organization) {
            if (organization) {
                console.log('Found organization::',organization);
                userCollection.findOne({email: userDeails['email']}, function (err, user) {
                    if (!user) {
                        userCollection.insertOne({
                            firstName: userDeails['firstName'],
                            lastName: userDeails['lastName'],
                            email: userDeails['email'],
                            password: passwordHash.generate(userDeails['password']),
                            roles: userDeails['roles'],
                            organization: organization._id,
                            signature: userDeails['signature'],
                            passcode: passwordHash.generate(userDeails['passcode']),
                            phoneNumber: userDeails['mobile'],
                            enabled:true }, function (error, newUser) {
                            if (newUser) {
                                userCollection.findOne({email: userDeails['email']}, function (err, user) {
                                    console.log('> Adding user roles');
                                    updateACLRoles(user).then(function(res){
                                        if (index === users.length-1) {
                                            console.log("Loaded all users");
                                            next();
                                        }
                                    })
                                });
                            } else {
                                console.log('Error occurred while saving user: ' + error);
                                next();
                            }
                        });
                    } else {
                        if (users.length === 1) {
                            next();
                        }
                    }
                });
            } else {
                console.log("Error while fetching organization" + error);
                next();
            }
        });
    });

    if (users.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};

function updateACLRoles(user){
    var deferred = Q.defer();
    app.locals.acl.addUserRoles(user._id.toString(), user.roles, function (errorOnAddRemoveRoles) {
        if (errorOnAddRemoveRoles) {
            console.log('Error occurred while saving acl roles' + errorOnAddRemoveRoles);
            deferred.reject(error)
        }
        deferred.resolve();
    });
    return deferred.promise;
}