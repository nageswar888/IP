/**
 * Created by praveen on 2/23/17.
 */
var app = require('../../../../server');
var Q = require('q');

var aclOperations = {
    addAndRemovePermissions:function(resourceMappingConfig){
        var deferred = Q.defer();
        //Reason to keep timeout here: by default "app" variable will not be loaded, this variable will scan the "server.js" file
        // and loads the application data. So to load the server.js content it takes sometime. So the below script should not be executed
        // until the app variable is initialized.
        setTimeout(function(){
            var allPromises = [];
            resourceMappingConfig.forEach(function(eachMapping, index) {

                /* Remove resources privileges */
                if(eachMapping.disAllowRoles) {
                    eachMapping.disAllowRoles.forEach(function(eachRole, idx) {
                        console.log("Removing ACL-Allow for role: "+eachRole.name);
                        var promiseObj = app.locals.acl.removeAllow(eachRole.name, eachMapping.resource, eachRole.permissions, function (error) {
                            if(error != null)
                                console.log("Error occurred while removing a role "+eachRole.name +", permission "+eachRole.permissions + "For resource "+eachMapping.resource);
                        });
                        allPromises.push(promiseObj)
                    });
                }

                /* Add resources privileges */
                if(eachMapping.roles) {
                    eachMapping.roles.forEach(function(eachRole, idx) {
                        console.log("Adding ACL-Allow for role: "+eachRole.name);
                        var promiseObj = app.locals.acl.allow(eachRole.name, eachMapping.resource, eachRole.permissions, function (error) {
                            if(error != null) {
                                console.log("Error occurred while adding a role "+eachRole.name +", permission "+eachRole.permissions + "For resource "+eachMapping.resource);
                                console.log(error);
                            }
                        });
                        allPromises.push(promiseObj)
                    });
                }
            });


            Q.allSettled(allPromises)
                .then(function (results) {
                    console.log('All Promises settled in aclOperations...');
                    deferred.resolve();
                }, function(error) {
                    deferred.reject(error);
                });
        }, 2000);
        return deferred.promise;
    }
};
module.exports = aclOperations;