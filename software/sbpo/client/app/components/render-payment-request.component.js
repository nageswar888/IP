'use strict';
(function(){
    angular.module('sbpo').component('renderPaymentRequest',{
        bindings: {
            payment: '='
        },
        templateUrl: '/app/partials/paymentRequests/renderPaymentRequest.html',
        controller:renderPaymentRequestController,
        controllerAs:'rpc'
    });
    renderPaymentRequestController.$inject=['paymentRequestService', '$filter', '$state', 'passUtilsService', '$rootScope', 'AclService'];
    function  renderPaymentRequestController(paymentRequestService, $filter, $state, passUtilsService, $rootScope, AclService){
        var vm=this;
        vm.rejectPaymentRequest = rejectPaymentRequest;
        vm.processPaymentReq = processPaymentReq;
        vm.canViewButtons = canViewButtons;
        vm.deletePaymentRequestModal = deletePaymentRequestModal;
        vm.canViewDeleteButton = canViewDeleteButton;
        vm.limit=2;
        vm.limitChange=limitChange;
        vm.closeOthers = true;

        //function for showing limited message
        function limitChange(limit){
            vm.limit=limit;
        }

        function canViewButtons(){
            if(vm.payment){
                return AclService.hasRole(['ROLE_INITIATOR']) &&
                    !(vm.payment.status === 'REJECTED' || vm.payment.status == 'APPROVED');
            }

        }
        function canViewDeleteButton(){
            if (vm.payment) {
                if (AclService.hasRole('ROLE_INITIATOR') && (vm.payment.status === 'REJECTED' || vm.payment.status === 'APPROVED')) {
                    return true;
                } else if (AclService.hasRole('ROLE_PAYMENT_REQUESTER') && (vm.payment.status === 'REJECTED' || vm.payment.status === 'SUBMITTED' || vm.payment.status === 'APPROVED')) {
                    return true;
                }
            }
        }

        function rejectPaymentRequest(){
            paymentRequestService.rejectPaymentRequestModal(vm.payment._id, function() {
                $state.go($state.current, {message:$filter('translate')('paymentRequest.rejected.success')},
                    {reload: true});
            });
        }

        function deletePaymentRequestModal() {
            paymentRequestService.deletePaymentReqPasscodeModal(vm.payment._id,false, function() {
                console.log("delete payement request");
                console.log($filter('translate')('paymentRequest.deleted.success'));
                $state.go($state.current, {message:$filter('translate')('paymentRequest.deleted.success')},
                    {reload: true});
            });
        }

        function processPaymentReq() {
            $state.go('createAdvice',{prObj:vm.payment});
        }
    }
}());
