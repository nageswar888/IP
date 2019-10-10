var passwordHash = require('password-hash');
var apiUtil=require('../../../../utils/apiUtils');

exports.up = function(db, next){
    var categories=[
        {name: 'Overhead', value: apiUtil.getCustomTypeValue('Overhead'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Bank Charges', value: apiUtil.getCustomTypeValue('Bank Charges'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Asset', value: apiUtil.getCustomTypeValue('Asset'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Material Purchase', value: apiUtil.getCustomTypeValue('Material Purchase'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Retained Money', value: apiUtil.getCustomTypeValue('Retained Money'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Other Expenses', value: apiUtil.getCustomTypeValue('Other Expenses'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Hr Expenses', value: apiUtil.getCustomTypeValue('Hr Expenses'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Emi', value: apiUtil.getCustomTypeValue('Emi'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')},
        {name: 'Office Expences', value: apiUtil.getCustomTypeValue('Office Expences'), organisation: 'Development',
            type: apiUtil.getCustomType('Category')}
    ];


    var orgCollection = db.collection('organizations');
    var customFieldsCollection = db.collection('customFields');
    categories.forEach(function(categoryDetails, index){
        orgCollection.findOne({name: new RegExp(categoryDetails['orgName'], "i")}, function (error, organization) {
            if (organization) {
                console.log('Found organization::', organization);
                customFieldsCollection.insertOne({
                    name: categoryDetails['name'],
                    value: categoryDetails['value'],
                    organization: organization._id,
                    type: categoryDetails['type'],
                    "expired" : false,
                    "__v" : 0
                }, function(error, newCategory){
                    if (index === categories.length-1) {
                        console.log("Loaded all payment types");
                        next();
                    }
                })
            }
        })
    });
    if (categories.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
