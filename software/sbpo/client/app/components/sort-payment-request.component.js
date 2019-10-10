'use strict';
(function(){
    angular.module('sbpo').component('sortPaymentRequest',{
        bindings: {
            getAllPaymentRequest: '&',
            groupByStatus:'=',
            getAllPaymentRequestByStatus: '&',
            currentStatus : '=',
            entireObject : '='

        },
        template: require('../partials/sortPaymentRequest.html'),
        controller:sortPaymentRequestController,
        controllerAs:'sprc'
    });
    sortPaymentRequestController.$inject=['$rootScope'];
    function  sortPaymentRequestController($rootScope){
        var vm=this;
        vm.changeSort=changeSort;
        vm.sortCriterias = [{"key":'Oldest first',"value":1},{"key":'Latest first',"value":-1}];
        vm.sortCriterias.selected =  vm.sortCriterias[1].value;
        function changeSort(sortCriteria){
            if($rootScope.isInitiatorRole()){
                vm.getAllPaymentRequestByStatus({sortCriteria:sortCriteria,groupByCriteria:vm.groupByStatus,status:vm.currentStatus});
            }else{
                vm.getAllPaymentRequestByStatus({sortCriteria:sortCriteria,groupByCriteria:vm.groupByStatus,status:vm.currentStatus});
            }
            $rootScope.$broadcast("sortEvent");
        }
    }
}());
