'use strict';
(function(){
    angular.module('sbpo').component('renderAdvice',{
        bindings: {
            advice: '=',
            status: '=',
            groupCategory:  '='
        },
        template: require('../partials/advice.html'),
        controller:renderAdviceController,
        controllerAs:'rsac'
    });
    renderAdviceController.$inject=['$cookies','$uibModal','paymentAdvice','$state','passUtilsService','$rootScope','Flash',
        'progressAdviceService','$filter', 'adviceEditType'];
    function  renderAdviceController($cookies,$uibModal,paymentAdvice,$state,passUtilsService,$rootScope,Flash,
                                     progressAdviceService,$filter,adviceEditType){
        var vm=this;
        vm.submitModal = submitModal;
        vm.approveModal = approveModal;
        vm.voidModal = voidModal;
        vm.rejectModal = rejectModal;
        vm.disburseredModal = disburseredModal;
        vm.commentModal=commentModal;
        vm.checkStatus=checkStatus;
        vm.viewAdvice=viewAdvice;
        vm.inprogressText=inprogressText;
        vm.limit=2;
        vm.limitChange=limitChange;
        vm.isEmpty = isEmpty;
        vm.getAdviceDetails=getAdviceDetails;
        vm.getAdviceDetails();
        vm.deleteAdvice=deleteAdvice;
        function deleteAdvice(advice){
            progressAdviceService.deleteAdviceModal(advice, function() {
                $state.go($state.current, {message:$filter('translate')('advice.deleted.success')},
                    {reload: true});
            });
        }
        function submitModal(advice) {
            paymentAdvice.saveAdviceRecord(advice).then(saveAdviceRecordSuccess).catch(saveAdviceRecordFailure);

            function saveAdviceRecordSuccess(response){
                var obj={
                    status:'Pending',
                    message:$filter('translate')('advice.submit.success')
                };
                $rootScope.refreshed = true;
                $state.go($state.current, obj, {reload: true});

            }
            function saveAdviceRecordFailure(error){
                console.log(error);
            }
        }
        function approveModal(advice) {
            progressAdviceService.approveAdvicePasscodeModal(advice, function() {
                $state.go($state.current, {message:$filter('translate')('advice.approved.success')},
                    {reload: true});
            });
        }

        function voidModal(advice) {
            progressAdviceService.voidAdvicePasscodeModal(advice, function() {
                $state.go($state.current, {message:$filter('translate')('advice.void.success')},
                    {reload: true});
            });
        }

        function rejectModal(advice) {
            progressAdviceService.rejectAdvicePasscodeModal(advice, function() {
                $state.go($state.current, {message:$filter('translate')('advice.rejected.success')},
                    {reload: true});

            });
        }
        function disburseredModal(advice) {
            var isValidate = progressAdviceService.validateDisbursedAdvice(advice);
            if(isValidate) {
                progressAdviceService.disburseredAdvicePasscodeModal(advice, function() {
                    $state.go($state.current, {message:$filter('translate')('advice.disbursed.success')},
                        {reload: true});
                });
            }else {
                $state.go('viewAdviceDetail', {id:advice._id, showValidation:true}, {reload: true});
            }

        }
        function commentModal(advice){
            paymentAdvice.commentAdviceModal(advice, function() {
                $state.go($state.current, {message:null}, {reload: true});
            });
        }
        function checkStatus(value,status){
            return passUtilsService.checkStatus(value,status);
        }
        function viewAdvice(advice){
            paymentAdvice.currentAdvice = advice;
            $state.go('viewAdviceDetail',{id: advice._id,editType:adviceEditType.EDIT_ADVICE});
        }
        function inprogressText(status){
            return passUtilsService.getInprogreessText(status);
        }
        //function for showing limited message
        function limitChange(limit){
            vm.limit=limit;
        }
        function isEmpty(object) {
            return passUtilsService.isEmpty(object);
        }
        function getAdviceDetails(){
            paymentAdvice.viewAdvice(vm.advice._id, true).then(viewAdviceSuccess).catch(viewAdviceFailure);
            function viewAdviceSuccess(response) {
                vm.advice = response.data;
            }
            function viewAdviceFailure(error){
                console.log(error);

            }
        }

    }
}());
