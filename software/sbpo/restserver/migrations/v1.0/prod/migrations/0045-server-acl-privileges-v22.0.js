var resourceMappingConfig = require('../config/resourceMappingConfig_v22.0.json')['resource-mapping'];
var aclOperations = require('../support/aclOperations');

exports.up = function(db, next){
    if (resourceMappingConfig.length === 0) {
        console.log("Skipping resourceMappingConfig_v22.0.json as it there is no content");
        next();
    } else {
        var aclOperationsPromise = aclOperations.addAndRemovePermissions(resourceMappingConfig);
        aclOperationsPromise.then(function (results) {
            console.log("Loaded all ACL roles from resourceMappingConfig_v22.0.json");
            next();
        });
    }
};
exports.down = function(db, next){
    next();
};
