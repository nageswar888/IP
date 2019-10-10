var passwordHash = require('password-hash');
var apiUtil=require('../../../../utils/apiUtils');

exports.up = function(db, next){
    var paymentTypes=[
        {name: 'Bill Payment', value: apiUtil.getCustomTypeValue('Bill Payment'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Advance', value: apiUtil.getCustomTypeValue('Advance'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Cash Disbursement', value: apiUtil.getCustomTypeValue('Cash Disbursement'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Loan Repayment', value: apiUtil.getCustomTypeValue('Loan Repayment'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Tax', value: apiUtil.getCustomTypeValue('Tax'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Bank Charges', value: apiUtil.getCustomTypeValue('Bank Charges'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Reimbursement', value: apiUtil.getCustomTypeValue('Reimbursement'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Salary', value: apiUtil.getCustomTypeValue('Salary'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Bonus', value: apiUtil.getCustomTypeValue('Bonus'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Overhead', value: apiUtil.getCustomTypeValue('Overhead'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')},
        {name: 'Loan To Others', value: apiUtil.getCustomTypeValue('Loan To Others'), organisation: 'Development',
            type: apiUtil.getCustomType('PaymentType')}
    ];


    var orgCollection = db.collection('organizations');
    var customFieldsCollection = db.collection('customFields');
    paymentTypes.forEach(function(paymentTypeDetails, index){
        orgCollection.findOne({name: new RegExp(paymentTypeDetails['orgName'], "i")}, function (error, organization) {
            if (organization) {
                console.log('Found organization::', organization);
                customFieldsCollection.insertOne({
                    name: paymentTypeDetails['name'],
                    value: paymentTypeDetails['value'],
                    organization: organization._id,
                    type: paymentTypeDetails['type'],
                    "expired" : false,
                    "__v" : 0
                }, function(error, newPaymentType){
                    if (index === paymentTypes.length-1) {
                        console.log("Loaded all payment types");
                        next();
                    }
                })
            }
        })
    });
    if (paymentTypes.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
