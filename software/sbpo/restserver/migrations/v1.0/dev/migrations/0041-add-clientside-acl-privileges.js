/**
 * Created by Ashish on 13/4/17.
 */
var mongodb = require('mongodb');
var Q = require('q');
exports.up = function(db, next){
    var privilegeCollection = db.collection('privileges');
    var rolesCollection = db.collection('roles');

    var privileges = [{code:'HOME',displayName:"Home"},
        {code:'PENDING_APPROVAL',displayName:"Pending Approval"},
        {code:'CREATE_ADVICE',displayName:"Create Advice"},
        {code:'LOGOUT',displayName:"Logout"},
        {code:'PAYEE_TABLE',displayName:"Payee Table"},
        {code:'ADMIN',displayName:"Admin"},
        {code:'CREATE_LEGACY',displayName:"Create Legacy"},
        {code:'VIEW_PAYMENT_HISTORY',displayName:"View Payment History"}];

    var rolePrivileges = {
        ROLE_INITIATOR          :     ['HOME','PENDING_APPROVAL','CREATE_ADVICE'],
        ROLE_VIEWER             :     ['LOGOUT','HOME'],
        ROLE_DISBURSER          :     ['LOGOUT','HOME','PENDING_APPROVAL','PAYEE_TABLE'],
        ROLE_LEVEL2APPROVER     :     ['LOGOUT','HOME','PENDING_APPROVAL'],
        ROLE_LEVEL3APPROVER     :     ['LOGOUT','HOME','PENDING_APPROVAL'],
        LEGACY_DATA_OPERATOR    :     ['LOGOUT','HOME','CREATE_LEGACY'],
        ROLE_PAYEE              :     ['LOGOUT','HOME','VIEW_PAYMENT_HISTORY'],
        ROLE_MASTERADMIN        :     ['LOGOUT','HOME','ADMIN'],
        ROLE_IPASS_MASTERADMIN  :     ['LOGOUT','HOME','ADMIN']
    };

    //Save Default privileges in db
    var currentPromiseTop = Q("");
    privileges.forEach(function(eachPrivilege,index){
        currentPromiseTop = currentPromiseTop.then(function() {
            return addPrivileges(eachPrivilege);
        });
    });
    currentPromiseTop.then(function() {
        var count=0;
        var currentPromise = Q("");
        var roleNames = Object.keys(rolePrivileges);
        for(var i=0;i<Object.keys(rolePrivileges).length;i++){
            currentPromise = currentPromise.then(function() {
                return preparePrivilege(roleNames[count++],rolePrivileges);
            });
        }
        currentPromise.then(function(){
            next();
        });
    });

    function preparePrivilege(roleName,rolePrivileges){
        var deferred = Q.defer();
        rolesCollection.findOne({name:roleName},function(error, roleDBObj){
            if(error) {
            }else if(!roleDBObj){
                console.log("not found this role");
            } else{
                var privilegesList = rolePrivileges[roleName];
                var currentPromiseBottom = Q("");

                privilegesList.forEach(function(eachPrv,privilegesListIndex){
                    currentPromiseBottom = currentPromiseBottom.then(function() {
                        return findAndUpdateRoles(eachPrv,privilegesListIndex,roleDBObj,privilegesList,roleName);
                    });
                });
                currentPromiseBottom.then(function(){
                    deferred.resolve();
                })
            }
        });
        return deferred.promise;
    }
    function addPrivileges(eachPrivilege){
        var deferred = Q.defer();
        privilegeCollection.save({
                code:eachPrivilege.code,
                displayName:eachPrivilege.displayName
            },function(err,data){
                if(err){
                    console.log("Error",err);
                }
                else{
                    deferred.resolve();
                }
            }
        );
        return deferred.promise;
    }


    function findAndUpdateRoles(eachPrv,privilegesListIndex,roleDBObj,privilegesList,roleName){
        var deferred = Q.defer();
        privilegeCollection.findOne({code: eachPrv}, function(err,privilege) {
            if(privilege){
                if(!roleDBObj.privileges)
                {
                    roleDBObj.privileges=[]
                }
                roleDBObj.privileges.push(privilege._id);
                if(privilegesListIndex === privilegesList.length-1){
                    rolesCollection.save(roleDBObj,function(err, data){
                        if(err){
                            deferred.reject();
                        }
                        else {
                            deferred.resolve();
                        }
                    });
                } else {
                    deferred.resolve();
                }
            }
            else{
                console.log("privilegeCollection error",err);
            }
        });
        return deferred.promise;
    }
};
exports.down = function(db, next){
    next();
};
