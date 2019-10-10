/**
 * Created by sb0103 on 8/11/16.
 */
(function(){
    angular.module('admin')

        .factory('addAdminPayeeService',addAdminPayeeService);
        addAdminPayeeService.$inject=['api','$q','loginService'];


        function addAdminPayeeService(api,$q,loginService){


            var service={
                getAllBanks:getAllBanks,
                submitAdminPayee:submitAdminPayee,
                getAllPayee:getAllPayee,
                editPayee:editPayee,
                deletePayee:deletePayee,
                getTotalPayeeCount:getTotalPayeeCount,
                getPayeesByName:getPayeesByName
            };

            return service;

            /**
             * this fuction  delete payee based on id
             * */
            function deletePayee(query){
                return api.deletePayee({id:query}).$promise;
            }
            /**
             * this fuction  edit payee based on id
             * */
            function editPayee(query){
                return api.editPayee({q:query,id:query._id}).$promise;
            }
            /**
             * this fuction  return all payee list
             * */
            function getAllPayee(query){
                return api.getPayees(query).$promise;
            }
            /**
             * this fuction  return count of payee
             * */
            function getTotalPayeeCount() {
                return api.getPayeeCount().$promise;
            }
            /**
             * this fuction  saves payee
             * */
            function submitAdminPayee(query){
                return api.postPayee({q:query}).$promise;
            }
            /**
             * this fuction  return all bank list
             * */
            function getAllBanks(){
               return api.getAllBanks().$promise;
            }

            function getPayeesByName(query){
                return api.getPayeesByName(query).$promise;
            }


    }
})();
