var mongodb = require('mongodb');
//var app = require('../../../../server');
var apiUtil=require('../../../../utils/apiUtils');
var ObjectID = require('mongodb-core').BSON.ObjectID;
var Q = require('q');
exports.up = function(db, next){
    var organizations = db.collection('organizations');
    var organization = organizations.findOne({name: 'DCL'},function(err,organization){
        var pr = Q("");
        if(organization){
            var CategoryCustomType = apiUtil.getCustomType('Category');
            var PaymentTypeCustomType = apiUtil.getCustomType('PaymentType');
            var categories=[
                {name: 'OverHead', value: apiUtil.getCustomTypeValue('OverHead'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Bank Charges', value: apiUtil.getCustomTypeValue('Bank Charges'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Asset', value: apiUtil.getCustomTypeValue('Asset'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Material Purchase', value: apiUtil.getCustomTypeValue('Material Purchase'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Retained Money', value: apiUtil.getCustomTypeValue('Retained Money'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Other Expenses', value: apiUtil.getCustomTypeValue('Other Expenses'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'HR Expenses', value: apiUtil.getCustomTypeValue('HR Expenses'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'EMI', value: apiUtil.getCustomTypeValue('EMI'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Office Expense', value: apiUtil.getCustomTypeValue('Office Expense'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Travel Expenses', value: apiUtil.getCustomTypeValue('Travel Expenses'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Meal Expenses', value: apiUtil.getCustomTypeValue('Meal Expenses'), organisation: organization._id,
                    type: CategoryCustomType},
                {name: 'Security', value: apiUtil.getCustomTypeValue('Security'), organisation: organization._id,
                    type: CategoryCustomType}
            ];
            var paymentTypes=[
                {name: 'Bill Payment', value: apiUtil.getCustomTypeValue('Bill Payment'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Advance', value: apiUtil.getCustomTypeValue('Advance'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Cash Disbursement', value: apiUtil.getCustomTypeValue('Cash Disbursement'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Loan Repayment', value: apiUtil.getCustomTypeValue('Loan Repayment'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Tax', value: apiUtil.getCustomTypeValue('Tax'), organisation: 'Development',
                    type: PaymentTypeCustomType},
                {name: 'Bank Charges', value: apiUtil.getCustomTypeValue('Bank Charges'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Reimbursement', value: apiUtil.getCustomTypeValue('Reimbursement'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Salary', value: apiUtil.getCustomTypeValue('Salary'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Bonus', value: apiUtil.getCustomTypeValue('Bonus'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Overhead', value: apiUtil.getCustomTypeValue('Overhead'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Loan To Others', value: apiUtil.getCustomTypeValue('Loan To Others'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Loan', value: apiUtil.getCustomTypeValue('Loan'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Repair And Maintenance', value: apiUtil.getCustomTypeValue('Repair And Maintenance'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Shareholding Distribution', value: apiUtil.getCustomTypeValue('Shareholding Distribution'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Hire Charges', value: apiUtil.getCustomTypeValue('Hire Charges'), organisation: organization._id,
                    type: PaymentTypeCustomType},
                {name: 'Security', value: apiUtil.getCustomTypeValue('Security'), organisation: organization._id,
                    type: PaymentTypeCustomType}
            ];
            //TODO: In the above list, we have 3 items for "Loan" related. Please check and remove

            pr = pr.then(function (response) {
                return createCustomField(categories, db, next);
            });
            pr = pr.then(function (response) {
                return createCustomField(paymentTypes, db, next);
            });
            pr.then(function (response) {
                console.log('Finished both the custom fields migration');
                next()
            });
        }else{
            console.log('Organisation not found.');
            next();
        }
    });
};

exports.down = function(db, next){
    next();
};
function createCustomField(customData, db, next){
    var deferred = Q.defer();
    customData.forEach(function(data, index) {
        var customFields=db.collection('customFields');
        customFields.insertOne({
            name: data['name'],
            value: data['value'],
            organization: data['organisation'],
            type: data['type']
        },function (error, newCustomField) {
            if (newCustomField) {
                if(index === customData.length-1) {
                    deferred.resolve();
                    console.log('Created all custom field entries.');
                }

            } else {
                console.log('Error occurred while saving Category: ' + error);
                deferred.reject(error);
            }
        });

    });
    return deferred.promise;
}
