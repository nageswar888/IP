'use strict';
(function(){
    angular
        .module('sbpo.paymentRequest')
        .controller('PaymentRequestController', PaymentRequestController);

    PaymentRequestController.$inject = ['paymentRequestService', 'Flash', 'category', '$stateParams', '$filter','$rootScope', 'AclService', '$state','passUtilsService'];

    function PaymentRequestController(paymentRequestService, Flash, category, $stateParams, $filter, $rootScope, AclService, $state,passUtilsService) {
        var vm = this;
        vm.closeOther = true;
        vm.isShowNoRecordMessage = false;
        vm.currentStatus = $stateParams.status;
        vm.paymentReqToDelete = [];
        vm.getAllPaymentRequest = getAllPaymentRequest;
        vm.groupByCriteria=category.GROUP_PROJECT;
        vm.showSuccessMessage = showSuccessMessage;
        vm.showSuccessMessage();
        vm.download=download;
        vm.canView=canViewDeletePaymentReqOption;
        vm.setDeletePaymentRequest = setDeletePaymentRequest;
        vm.deletePaymentRequests = deletePaymentRequests;
        /*vm.freezeActionItems=passUtilsService.freezeActionIcons();*/

        /**
         * This function will push and pop the payment request ids based on the check box value
         * @param paymentReq
         */
        function setDeletePaymentRequest(paymentReq) {
            for(var key in paymentReq){
                if((paymentReq[key] === true) && vm.paymentReqToDelete.indexOf(key) === -1) {
                    vm.paymentReqToDelete.push(key)
                }
                else if((paymentReq[key] === false) && vm.paymentReqToDelete.indexOf(key) !== -1){
                    for(var i = vm.paymentReqToDelete.length - 1; i >= 0; i--) {
                        if(vm.paymentReqToDelete[i] === key) {
                            vm.paymentReqToDelete.splice(i, 1);
                        }
                    }
                }
            }
        }

        /**
         * This function will open the delete modal
         * @param vm.paymentReqToDelete (list of ids)
         * @param true (true : for multi delete, false: single delete)
         * @param anonymous function
         */
        function deletePaymentRequests(){
            paymentRequestService.deletePaymentReqPasscodeModal(vm.paymentReqToDelete, true, function() {
                $state.go($state.current, {message:$filter('translate')('payment.req.deleted.success')},
                    {reload: true});
            });
        }



        /*vm.freezeActionItems=passUtilsService.freezeActionIcons();*/
        if($rootScope.isAuthenticated()){
            $rootScope.$broadcast('updatePaymentReqCount');
        }

        if ($rootScope.isInitiatorRole()) {
            getAllPaymentRequest(-1, vm.groupByCriteria);
        }

        /**
         * This function will check the user role and  current selected tab value
         * and based on that allow user to see delete options
         */
        function canViewDeletePaymentReqOption() {
            return ((AclService.hasAnyRole(['ROLE_INITIATOR']) && vm.currentStatus === 'PaymentRequests'));
        }

        function download(type){
            var query={type:type};
            window.open('/api/advices/downloadPaymentRequest?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));

        }

        function getAllPaymentRequest(sortCriteria, groupByCriteria) {
            vm.sortCriteria = sortCriteria;
            paymentRequestService.listAllPaymentRequest({
                sortCriteria: sortCriteria,
                groupByCriteria: groupByCriteria
            }).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                if (response.data === undefined || response.data === 'empty' || response.data.length === 0) {
                    vm.noRecordMessage = $filter('translate')('payment.request.not.found');
                    vm.isShowNoRecordMessage = true;
                } else {
                    vm.paymentRequests = response.data;
                }
            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }

        function showSuccessMessage() {
            vm.message = $stateParams.message;
            Flash.create('success', vm.message, 'paymentRequestFlashMessage');

        }
    }
}());


