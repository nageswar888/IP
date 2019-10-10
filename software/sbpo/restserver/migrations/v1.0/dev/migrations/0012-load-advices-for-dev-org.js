var passwordHash = require('password-hash');
var typeEnum = require("../../../../enums/customType");

exports.up = function(db, next){
    var today = new Date();

    var advices = [
        {
            user: 'initiator.1@ipaas.com', payee: 'payee@one.com', requestedDate:today, requestedAmount:100000, modifiedDate: today,
            paymentType:'Bill Payment', billAmountDue:1000, paymentMode:'Cash', requestedBy:'User One', initiatedBy:'User One',
            project:'iPASS', startDate:today, endDate:today, adviceStatus:'Submitted', orgName: "Development"
        },
        {
            user: 'initiator.1@ipaas.com', payee: 'payee@one.com', requestedDate:today, requestedAmount:1000000, modifiedDate: today,
            paymentType:'Bill Payment', billAmountDue:100000, paymentMode:'Cash', requestedBy:'User One', initiatedBy:'User One',
            project:'iPASS', startDate:today, endDate:today, adviceStatus:'Submitted', orgName: "Development"
        },
        {
            user: 'initiator.1@ipaas.com', payee: 'payee@one.com', requestedDate:today, requestedAmount:2000, modifiedDate: today,
            paymentType:'Bill Payment', billAmountDue:15000, paymentMode:'Cash', requestedBy:'User One', initiatedBy:'User One',
            project:'iPASS', startDate:today, endDate:today, adviceStatus:'Submitted', orgName: "Development"
        },
        {
            user: 'initiator.1@ipaas.com', payee: 'payee@one.com', requestedDate:today, requestedAmount:3500, modifiedDate: today,
            paymentType:'Bill Payment', billAmountDue:5000, paymentMode:'Cash', requestedBy:'User One', initiatedBy:'User One',
            project:'iPASS', startDate:today, endDate:today, adviceStatus:'Submitted', orgName: "Development"
        },
        {
            user: 'initiator.1@ipaas.com', payee: 'payee@one.com', requestedDate:today, requestedAmount:79000, modifiedDate: today,
            paymentType:'Bill Payment', billAmountDue:86700, paymentMode:'Cash', requestedBy:'User One', initiatedBy:'User One',
            project:'iPASS', startDate:today, endDate:today, adviceStatus:'Submitted', orgName: "Development"
        }
    ];

    var orgCollection = db.collection('organizations');
    var usersCollection = db.collection('users');
    var payeesCollection = db.collection('payees');
    var projectsCollection = db.collection('projects');
    var advicesCollection = db.collection('advices');
    var customFieldsCollection = db.collection('customFields');
    var counterCollection = db.collection('counters');

    advices.forEach(function(adviceDetails, index){
        orgCollection.findOne({name: new RegExp(adviceDetails['orgName'], "i")}, function (error, organization) {
            if (organization) {
                console.log('Found organization::', organization);
                usersCollection.findOne({email: adviceDetails['user']}, function (error, userInstance) {
                    if (userInstance) {
                        console.log('Found user::', userInstance);
                        var matchCondtion = { "user.email": adviceDetails['payee'] }
                        var aggQ= [
                            {$lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" }},
                            {$unwind:"$user"},
                            {$match:matchCondtion}
                        ]
                        //console.log(JSON.stringify(aggQ));
                        payeesCollection.aggregate(aggQ, function (error, payeeInstance) {
                            if (payeeInstance[0]) {
                                console.log('Found payee::', payeeInstance[0]);
                                projectsCollection.findOne({projectName: new RegExp(adviceDetails['project'], "i")}, function (error, projectInstance) {
                                    if (projectInstance) {
                                        console.log('Found project::', projectInstance);
                                        customFieldsCollection.findOne({name: new RegExp(adviceDetails['paymentType'], "i"), type: typeEnum.PAYMENT_TYPE.code },
                                            function (error, paymentTypeIns) {
                                            if (paymentTypeIns) {
                                                console.log('Found paymentType::', paymentTypeIns);
                                                var s = "000000000" + index;
                                                advicesCollection.insertOne({
                                                    user: userInstance._id,
                                                    payee: payeeInstance[0]._id,
                                                    adviceNumber: organization.code+''+s.substr(s.length-10),
                                                    requestedDate: adviceDetails['requestedDate'],
                                                    requestedAmount: adviceDetails['requestedAmount'],
                                                    paymentType: paymentTypeIns._id,
                                                    billAmountDue: adviceDetails['billAmountDue'],
                                                    type: 'Cash',
                                                    requestedBy: adviceDetails['requestedBy'],
                                                    initiatedBy: adviceDetails['initiatedBy'],
                                                    project: projectInstance._id,
                                                    startDate: today,
                                                    modifiedDate : today,
                                                    endDate: today,
                                                    adviceStatus: adviceDetails['adviceStatus'],
                                                    "expired" : false,
                                                    "seq": index+1,
                                                    "__v" : 0,
                                                    organization: organization._id
                                                }, function(error, response){
                                                    console.log("error")
                                                    console.log(error)
                                                    console.log("error")
                                                    console.log("indexindex: "+ index)
                                                    if (index === advices.length-1) {
                                                        setTimeout(function(){
                                                            console.log("Added advices to "+organization.name);
                                                            counterCollection.insertOne({"_id": "seq", "seq": index+1, "model": "Advice"}, function(err, res){
                                                                if (err){
                                                                    console.log(err)
                                                                    throw err
                                                                }
                                                                next()
                                                            });
                                                        }, 10000);
                                                    }
                                                })

                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    });
    if (advices.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
