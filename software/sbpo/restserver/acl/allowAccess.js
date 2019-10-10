/*var resourceMappings = require('./resourceMappings');

module.exports = function(acl) {
    console.log("Populate access rules")
    resourceMappings.forEach(function(eachMapping) {
        eachMapping.roles.forEach(function(eachRole) {
            acl.allow(eachRole.name, eachMapping.resource, eachRole.permissions);
        });
    });
    console.log("Done populate access rules")
};*/
