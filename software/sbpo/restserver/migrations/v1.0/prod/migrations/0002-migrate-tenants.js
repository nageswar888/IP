var mongodb = require('mongodb');
var mongoose = require('mongoose');
var organizationUtils = require('../../../../utils/organizationUtils');

exports.up = function(db, next){
    var tenants = db.collection('tenants');
    var organizations = db.collection('organizations');
    console.log('Removing existing tenants');
    //TODO: update the attribute values once we confirm for DCL organisation
    var organization = organizations.findOne({name: 'DCL'},function(err,organization){
        console.log('Creating new tenant DCL');
        if(organization===null) {
            organizationUtils.isValid('DCL', 'dcl').then(function(isValid) {
                organizations.insertOne({ name: 'DCL', subDomain: 'dcl', sector: 'Information Technology', code: 'DCL', enabled: true }, function(error, newOrg) {
                    if (error) {
                        console.log('Error occurred while saving organization: ' + error);
                    } else {
                        console.log('Migration completed ');
                        tenants.drop();
                        next();
                    }
                });
            }, function(error) {
                console.log(error);
                if(error.indexOf("Organization already exists with same sub domain")>=0) {
                    next();
                }
            });
        } else {
            console.log('Organization already exists so skipping.');
            if(index === tenants.length-1) {
                //As we've moved tenants table to organisations collection, Dropping the tenant collection from db
                tenants.drop();
                next();
            }
        }
    });
};

exports.down = function(db, next){
    next();
};
