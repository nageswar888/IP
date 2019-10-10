var resourceMappingConfig = require('../config/resourceMappingConfig_v8.0.json')['resource-mapping'];
var aclOperations = require('../support/aclOperations');

exports.up = function(db, next){
    console.log(resourceMappingConfig);
    if (resourceMappingConfig.length === 0) {
        next();
    } else {
        var aclOperationsPromise = aclOperations.addAndRemovePermissions(resourceMappingConfig);
        aclOperationsPromise.then(function (results) {
            console.log("Loaded all ACL roles from resourceMappingConfig_v7.0.json");
            next();
        });
    }
};
exports.down = function(db, next){
    next();
};
