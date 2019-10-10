var mongodb = require('mongodb');
exports.up = function(db, next){
    var customFields=db.collection('customFields');
    var bulk = db.collection('advices').initializeUnorderedBulkOp();
    console.log('Migrating the custom fields ...');
    customFields.find({}, function(err, cursor){
        cursor.toArray(function(err, customFieldList) {
            customFieldList.forEach(function (customField, customFieldIndex) {
                if(customField.type === "PAYMENT_TYPE") {
                    bulk.find( { paymentType: customField.name, organization: customField.organization} )
                        .update( { $set: { "paymentType" : customField._id }});
                }
                if(customField.type === "CATEGORY") {
                    bulk.find( { category: customField.name, organization: customField.organization  } )
                    .update( { $set: { "category" : customField._id }});
                }

                if(customFieldIndex === customFieldList.length-1) {
                    console.log('Updating all advices ...');
                    bulk.execute();
                    setTimeout(function(){
                        console.log('Finishing custom-fields migration...');
                        next();
                    },500);
                }
            });
        });
    });
};

exports.down = function(db, next){
    next();
};
