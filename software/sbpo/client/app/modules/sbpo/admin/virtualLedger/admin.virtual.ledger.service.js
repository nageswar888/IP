/**
 * Created by praveen on 3/22/17.
 */
"use strict";
(function(){

    angular
        .module('admin')
        .factory('virtualLedgerService', virtualLedgerService);

    virtualLedgerService.$inject = ['api'];
    function virtualLedgerService(api) {
        var service = {
            listVirtualLedger:listVirtualLedger,
            saveVirtualLedger:saveVirtualLedger,
            deleteVirtualLedger:deleteVirtualLedger,
            getVirtualLedgersByName:getVirtualLedgersByName,
            getLedgerByName:getLedgerByName
        };
        return service;

        function listVirtualLedger(query){
            return api.listVirtualLedger(query).$promise;
        }

        function saveVirtualLedger(query){
            return api.saveVirtualLedger({q:query}).$promise;
        }

        function deleteVirtualLedger(ledgerId){
            return api.deleteVirtualLedger({id:ledgerId}).$promise;
        }

        function getVirtualLedgersByName(query){
            return api.getVirtualLedgersByName(query).$promise;
        }
        function getLedgerByName(query) {
            return api.getLedgerByName(query).$promise;
        }

    }
}());