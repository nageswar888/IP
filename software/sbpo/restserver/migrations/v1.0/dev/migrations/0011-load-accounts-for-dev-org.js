var passwordHash = require('password-hash');
var apiUtil=require('../../../../utils/apiUtils');

exports.up = function(db, next){
    var accounts = [
        {accountName: "Suyash", accountNo: "1215454", bankName: "Axis Bank",
            branchName: "Hyderabad", ifscCode:"AX1234", address:"Hyderabad", accountType:"Bank Account",
            creditCardNumber:"", debitCardNumber:"", openingBalance:1000, orgName : "Development"},
        {accountName: "Mohan", accountNo: "444781", bankName: "HDFC Bank",
            branchName: "Hyderabad", ifscCode:"HD4532", address:"Hyderabad", accountType:"Bank Account",
            creditCardNumber:"", debitCardNumber:"", openingBalance:1500, orgName : "Development"}
    ];

    var orgCollection = db.collection('organizations');
    var banksCollection = db.collection('banks');
    accounts.forEach(function(accountDetails, index){
        orgCollection.findOne({name: new RegExp(accountDetails['orgName'], "i")}, function (error, organization) {
            if (organization) {
                console.log('Found organization::', organization);
                banksCollection.insertOne({
                    accountName: accountDetails['accountName'],
                    accountNo: accountDetails['accountNo'],
                    bankName: accountDetails['bankName'],
                    branchName: accountDetails['branchName'],
                    ifscCode: accountDetails['ifscCode'],
                    address: accountDetails['address'],
                    accountType: accountDetails['accountType'],
                    creditCardNumber: accountDetails['creditCardNumber'],
                    debitCardNumber: accountDetails['debitCardNumber'],
                    openingBalance: accountDetails['openingBalance'],
                    asOf: new Date(),
                    "expired" : false,
                    "__v" : 0,
                    organization : organization._id}, function(error, newAccount){
                    if (index === accounts.length-1) {
                        console.log("Loaded all accounts");
                        next();
                    }
                });
            }
        })
    });
    if (accounts.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
