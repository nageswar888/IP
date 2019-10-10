var passwordHash = require('password-hash');
var randomstring = require("randomstring");
var Q = require('q');
var app = require('../../../../server');

exports.up = function(db, next){
    var users = [
        {firstName: 'Sridhar', lastName: 'Thumma', email: 'sridhar.thumma@india.semanticbits.com', password: 'Password123',
            roles: ['ROLE_IPASS_MASTERADMIN'], orgName: 'SemanticBits', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9881455521'},
        {firstName: 'John', lastName: 'Doe', email: 'john.doe@india.semanticbits.com', password: 'Password123',
            roles: ['ROLE_MASTERADMIN'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455522'},
        {firstName: 'Initiator', lastName: 'One', email: 'initiator.1@ipaas.com', password: 'Password123',
            roles: ['ROLE_INITIATOR'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455523'},
        {firstName: 'Approver', lastName: 'Two', email: 'approver.2@ipaas.com', password: 'Password123',
            roles: ['ROLE_LEVEL2APPROVER'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455524'},
        {firstName: 'Approver', lastName: 'Three', email: 'approver.3@ipaas.com', password: 'Password123',
            roles: ['ROLE_LEVEL3APPROVER'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455525'},
        {firstName: 'Disburser', lastName: 'One', email: 'disburser.1@ipaas.com', password: 'Password123',
            roles: ['ROLE_DISBURSER'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455526'},
        {firstName: 'Raman', lastName: 'Raman', email: 'raman@semanticbits.com', password: 'Password123',
            roles: ['LEGACY_DATA_OPERATOR'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455527'},
        {firstName: 'Payee', lastName: 'One', email: 'payee@one.com', password: 'Password123',
            roles: ['ROLE_PAYEE'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455527'},
        {firstName: 'Payment requester', lastName: 'One', email: 'paymentrequester@one.com', password: 'Password123',
            roles: ['ROLE_PAYMENT_REQUESTER'], orgName: 'Development', signature: 'vinay.jpg', passcode: 'passcode',
            mobile: '9191455527'}
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
                                if (userDeails['roles'].indexOf('ROLE_PAYEE') === 0){
                                    userCollection.findOne({email: userDeails['email']}, function (err, user) {
                                        createPayee(db, user, organization).then(function(res){
                                            updateACLRoles(user).then(function(res){
                                                proceedNext(index, users.length, next);
                                            })
                                        })
                                    })
                                } else if (userDeails['roles'].indexOf('ROLE_PAYMENT_REQUESTER') === 0){
                                    userCollection.findOne({email: userDeails['email']}, function (err, user) {
                                        createPaymentRequester(db, user, organization._id).then(function(res){
                                            updateACLRoles(user).then(function(res){
                                                proceedNext(index, users.length, next);
                                            })
                                        })
                                    })
                                } else {
                                    userCollection.findOne({email: userDeails['email']}, function (err, user) {
                                        updateACLRoles(user).then(function(res){
                                            proceedNext(index, users.length, next);
                                        })
                                    })
                                }
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

function proceedNext(index, length, next) {
    console.log('> Adding user roles');
    if (index === length-1) {
        console.log("Loaded all users");
        next();
    }
}
function createPayee(db, user, organization) {
    var deferred = Q.defer();
    var payeesCollection = db.collection('payees');
    var payeeObj = {
        "bankName" : randomstring.generate({length:8,charset:'alphabetic'}),
        "ifscCode" : randomstring.generate({length:8,charset:'alphanumeric'}),
        "bankBranch" : randomstring.generate({length:8,charset:'alphabetic'}),
        "accountNumber" : randomstring.generate({length:8,charset:'numeric'}),
        "organization" : organization._id,
        "user" : user._id,
        "payeeNumber" : randomstring.generate({length:8,charset:'numeric'}),
        "expired" : false
    };
    payeesCollection.insertOne(payeeObj,function (error, payeeInstance) {
        if (payeeInstance) {
            deferred.resolve();
        } else {
            console.log('Error occurred while saving payee: ' + error);
            deferred.reject(error);
        }
    });
    return deferred.promise;
}


function createPaymentRequester(db, user, orgId) {
    var deferred = Q.defer();
    var paymentRequestersCollection = db.collection('paymentRequesters');
    var paymentReqObj = {
        assignedProjects: [],
        "user" : user._id,
        "organization":orgId
    };
    paymentRequestersCollection.insertOne(paymentReqObj,function (error, prInstance) {
        if (prInstance) {
            deferred.resolve();
        } else {
            console.log('Error occurred while saving payee: ' + error);
            deferred.reject(error);
        }
    });
    return deferred.promise;
}


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