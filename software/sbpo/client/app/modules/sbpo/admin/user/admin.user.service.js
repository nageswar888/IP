/**
 * Created by sb0103 on 10/11/16.
 */

(function(){
    angular.module('admin')
        .factory('addUserService',addUserService);

        addUserService.$inject=['$q','api','loginService'];

    function addUserService($q,api,loginService){
        var service={
            submitUser:submitUser,
            getAllRoles:getAllRoles,
            getAllUser:getAllUser,
            editUser:editUser,
            deleteUser:deleteUser,
            getUserByID:getUserByID,
            changePasscode:changePasscode,
            getTotalUsersCount:getTotalUsersCount
        };
        return service;

        /**
         * this fuction gives  user details
         *@returns {object}
         * */
        function getAllUser(query){
           return  api.listUser(query).$promise;
        }
        /**
         * this function will return user count
         *@returns {object}
         * */
        function getTotalUsersCount(){
            return  api.getUserCount().$promise;
        }
        /**
         * this fuction  edit user details
         * @param query
         * */
        function editUser(query){
            var forceFlag=false
            if(query.user){
                if(query.forceFlag){
                    forceFlag=query.forceFlag
                }
                query=query.user
            }
            return api.editUser({q:query,id:query._id,forceFlag:forceFlag}).$promise;
        }

        /**
         * this fuction  delete user details
         * @param userId
         * @param passCode
         * */
        function deleteUser(userId){
            var queryParams={
                id:userId
            };
            var query = angular.extend({},queryParams);
            return api.deleteUser({q:query, id:userId}).$promise;
        }
        /**
         * this fuction  give all roles
         * */
        function getAllRoles(query){
            return api.getAllRoles(query).$promise;
        }

        /**
         * this function saves user details
         *@returns {object}
         * @param query
         * */
        function submitUser(query){
            return api.submitUser({q:query}).$promise;
        }
        /**
         * this fuction  give user  based on id
         * */
        function getUserByID(query){
            return api.getUserById({q:query, id:query}).$promise;
        }
        /**
         * this fuction  changing passcode
         * */
        function changePasscode(qurey){
            return api.changePasscode(qurey).$promise;
        }
    }
})();
