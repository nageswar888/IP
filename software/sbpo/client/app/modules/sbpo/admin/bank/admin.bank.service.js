/**
 * Created by sb0103 on 8/11/16.
 */
(function () {
    angular.module('admin')
        .factory('addBankService',addBankService);
    addBankService.$inject=['loginService','api','$q'];

    function addBankService(loginService,api, $q){

        var service={
            submitBank:submitBank,
            getAllBanks:getAllBanks,
            editBankDetail:editBankDetail,
            deleteBank:deleteBank,
            getTotalAccountCount:getTotalAccountCount
        };
        return service;
        /**
         * this fuction  delete bank based on id
         * */
        function deleteBank(query){
            return api.deleteBank({id:query}).$promise;
        }
        /**
         * this fuction  edit bank based on id
         * */
        function editBankDetail(query){
            return api.editBankDetail({q:query,id:query.id}).$promise;
        }
        /**
         * this fuction  return all bank
         * */
        function getAllBanks(query){
            return api.getAllBanks(query).$promise;
        }
        /**
         * this function will return total count of account
         * */
        function getTotalAccountCount() {
            return api.getBankCount().$promise;
        }
        /**
         * this fuction saves bank
         * */
        function submitBank(query){
            return  api.submitBank({q:query}).$promise;
        }
    }
})();
