/**
 * Created by sb0103 on 10/01/17.
 */
(function(){
    angular.module('admin')

        .factory('notificationService',notificationService);
    notificationService.$inject=['api','$q','loginService'];


    function notificationService(api,$q,loginService){
        var service={
            saveContact:saveContact,
            deleteEmailId:deleteEmailId,
            deleteMobileNo:deleteMobileNo,
            changeStatus:changeStatus,
            listManageNotification:listManageNotification,
            getEmailIds:getEmailIds,
            getMobileNo:getMobileNo,
            editContact:editContact

        };

        return service;

        function editContact(query){
            return api.editContact(query).$promise;
        }
        function getMobileNo(){
            return api.getMobileNo().$promise;
        }

        function getEmailIds(){
            return api.getEmailIds().$promise;
        }

        function listManageNotification(){
            return api.listManageNotification().$promise;
        }

        function changeStatus(query){
            return api.changeStatus(query).$promise;
        }
        function deleteMobileNo(query){
            return api.deleteMobileNo({id:query}).$promise;
        }

        function deleteEmailId(query){
            console.log("insiede service")
            return api.deleteEmailId({id:query}).$promise;
        }

        function saveContact(query){
            return api.saveContact({q:query}).$promise;
        }
    }
})();
