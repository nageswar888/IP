'use strict';
(function(){
    angular
        .module('sbpo.paymentRequest')
        .controller('addPaymentRequestController', addPaymentRequestController);

    addPaymentRequestController.$inject = ['paymentRequestService', 'paymentAdvice', 'passUtilsService', 'customType', 'Flash', '$filter', '$state','$rootScope'];

    function addPaymentRequestController(paymentRequestService, paymentAdvice, passUtilsService, customType, Flash, $filter, $state,$rootScope) {
        var vm = this;
        vm.savePaymentRequest = savePaymentRequest;
        vm.getAllPayees = getAllPayees;
        vm.getPaymentRequesterProjects = getPaymentRequesterProjects;
        vm.paymentTypes = passUtilsService.populateCustomFields(customType.PAYMENT_TYPE);
        vm.cancel = cancel;
        vm.paymentRequest={};

        vm.getPaymentRequesterProjects()
        function getAllPayees(searchTerm){
            paymentAdvice.getPayeesByName({payeeName:searchTerm}).then(handleReadPayeesSuccess).catch(handleReadPayeesFailure);
            function handleReadPayeesSuccess(response) {
                vm.payees=response.data;
            }
            function handleReadPayeesFailure(error){
                console.log(error);
            }
        }

        function getPaymentRequesterProjects(){
            var query=$rootScope.getCurrentLoggedInUser()._id;
            paymentRequestService.listAsignedProjects(query).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                vm.project=response.data;
            }
            function handleReadProjectsFailure(error){
                console.log(error);
            }
        }
        function numberTotext(value){
            vm.numberTotexts = passUtilsService.convertINRToWord(value);
        }

        function savePaymentRequest(){
            if(vm.createPaymentRequestForm.$valid){
                vm.paymentRequest.project=vm.project;
                if(vm.paymentRequest.requestedAmount!=0){
                    vm.paymentRequest.user=$rootScope.getCurrentLoggedInUser()._id;
                    paymentRequestService.submitPaymentRequest(vm.paymentRequest).then(function(response){
                        if( response.status === 500 ) {
                            Flash.create('danger', response.messages,'paymentRequestFlashMessage');
                        } else {
                            $state.go( 'inprogressPaymentRequests', { message:$filter('translate')('paymentRequest.saved.success')},
                                {reload: true});
                        }
                    }).catch(function(errResponse){
                        Flash.create('danger', $filter('translate')('some.thing.went.wrong'),'paymentRequestFlashMessage');
                    });
                }else{
                    Flash.create('danger',$filter('translate')('amount.field.error'),'paymentRequestFlashMessage');
                }
            }else{
                Flash.create('danger',$filter('translate')('advice.form.mandatoryField'),'paymentRequestFlashMessage');
            }
        }

        function cancel(){
            $state.go( 'inprogressPaymentRequests', {},{ reload: true });
        }
    }
}());

