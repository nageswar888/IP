var resourceMappingConfig = require('../config/resourceMappingConfig_v18.0.json')['resource-mapping'];
var aclOperations = require('../support/aclOperations');

exports.up = function(db, next){
    console.log(resourceMappingConfig);
    if (resourceMappingConfig.length === 0) {
        console.log("Skipping resourceMappingConfig_v18.0.json as it there is no content");
        next();
    } else {
        var aclOperationsPromise = aclOperations.addAndRemovePermissions(resourceMappingConfig);
        aclOperationsPromise.then(function (results) {
            console.log("Loaded all ACL roles from resourceMappingConfig_v18.0.json");
            next();
        });
    }
};
exports.down = function(db, next){
    next();
};