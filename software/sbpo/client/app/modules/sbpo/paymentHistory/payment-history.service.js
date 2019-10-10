'use strict';
(function () {
    angular
        .module('sbpo.paymentHistory')
        .factory('paymentHistoryService', paymentHistoryService);
    paymentHistoryService.$inject = ['api'];

    function paymentHistoryService(api) {
        var service = {
            getPayeesByName : getPayeesByName,
            getPaymentHistory : getPaymentHistory,
            fetchTotalAmount : fetchTotalAmount
        };
        return service;

        function fetchTotalAmount(query){
            return api.fetchTotalAmount({q : query}).$promise;
        }
        function getPayeesByName(query){
            return api.getPayeesByName(query).$promise;
        }

        function getPaymentHistory(query){
            return api.searchPaymentHistory({q : query}).$promise;
        }

    }
}());
