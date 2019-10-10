(function(){
    angular
        .module('sbpo.progressAdvice')
        .factory('progressAdviceService', progressAdviceService);
    progressAdviceService.$inject = ['api','$q','$uibModal','$rootScope','passUtilsService','$filter'];
    function progressAdviceService(api,$q,$uibModal,$rootScope,passUtilsService,$filter){
        var service={
            getAdviceByStatus:getAdviceByStatus,
            approveAdvicePasscodeModal: approveAdvicePasscodeModal,
            voidAdvicePasscodeModal: voidAdvicePasscodeModal,
            rejectAdvicePasscodeModal: rejectAdvicePasscodeModal,
            disburseredAdvicePasscodeModal:disburseredAdvicePasscodeModal,
            deleteAdviceModal : deleteAdviceModal,
            approveAdvice: approveAdvice,
            rejectAdvice: rejectAdvice,
            voidAdvice: voidAdvice,
            disburseAdvice:disburseAdvice,
            validateDisbursedAdvice : validateDisbursedAdvice,
            deleteAdvice : deleteAdvice,
            submitAdviceRecord : submitAdviceRecord,
            deleteSeletedAdvices: deleteSeletedAdvices,
            deleteSeletedAdvicesModal: deleteSeletedAdvicesModal
        };
        return service;


        /**
         * this function will open the delete advice modal
         * @param ids
         * @param afterDeleted
         */
        function deleteSeletedAdvicesModal(ids, afterDeleted){

            var uibModalInstance = $uibModal.open({
                templateUrl: '/app/partials/advices/deleteAdvicesModal.html',
                controller: function ($scope,$uibModalInstance,progressAdviceService, Flash) {
                    $scope.deleteAdviceFormSubmitted = false;
                    $scope.closePopup = closePopup;
                    $scope.deleteAdvises = deleteAdvises;
                    $scope.ids = ids;
                    function closePopup() {
                        $uibModalInstance.dismiss('cancel');
                    };

                    function deleteAdvises() {

                        if($scope.deleteAdvicesConfirmationForm.$valid){
                            progressAdviceService.deleteSeletedAdvices(ids,$scope.passcode)
                                .then(handleDeleteAdvicesSuccess)
                                .catch(handleDeleteAdvicesFail);
                        }

                        function handleDeleteAdvicesSuccess(response){
                            if(response.status==404){
                                Flash.create('danger', $filter('translate')(response.messages),'advicesFlashMsgDiv');
                            }
                            else if(response.status === 304 && response.messages === "Passcode not matching") {
                                Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'advicesFlashMsgDiv');
                            }
                            else if(response.status === 550) {
                                Flash.create('danger', $filter('translate')(response.messages),'advicesFlashMsgDiv');
                            }
                            else if(response.status === 500) {
                                Flash.create('danger', $filter('translate')(response.messages),'advicesFlashMsgDiv');
                            }
                            else if(response.status==200){
                                if(afterDeleted) {
                                    afterDeleted();
                                }
                                $rootScope.$broadcast('updateAdviceCount');
                                $rootScope.refreshed = true;
                                $uibModalInstance.dismiss('cancel');
                            }
                        }
                        function handleDeleteAdvicesFail(error){
                            console.log(error);
                        }

                    }
                }
            });
        }

        /**
         * delete bulk of selected advices
         * @param ids
         * @param passcode
         */
        function deleteSeletedAdvices(ids,passcode) {
            var queryParams={
                passCode:passcode,
                ids: ids
            };
            return api.deleteAdvices({q:queryParams}).$promise;
        }



        /**
         * Update advice object in rootscope
         * @param data
         */
        function updateAdviceInScope(advice){
            var index = passUtilsService.findIndexByKeyAndValue($rootScope.advicesData, '_id', advice.data._id);
            if(index>-1) {
                $rootScope.advicesData[index] = advice.data;

                $rootScope.advicesData.splice(index, 1);

            }
        }function updateAdviceInScopeForDisburser(advice){
            var index = passUtilsService.findIndexByKeyAndValue($rootScope.advicesData, '_id', advice.data._id);
            if(index>-1) {
                $rootScope.advicesData[index] = advice.data;

            }
        }
        //getting advices based on status i.e Pending and InProgress
        function getAdviceByStatus(query){
            return api.advicesByRole({q: query}).$promise;
        }
        //function for opening passcode modal and calling approve function
        function approveAdvicePasscodeModal(advice, afterApprove, onlyVerifyPassCode) {
            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/passcode.html'),
                controller: function ($uibModalInstance,progressAdviceService,$state,Flash,$timeout) {
                    var pc=this;
                    pc.advice=advice;
                    pc.hidePasscodeEntry=false;
                    pc.hideDisburseDate = false;
                    pc.approveAdviceWithPasscode=approveAdviceWithPasscode;
                    function approveAdviceWithPasscode(){
                        if(pc.form.$valid){
                            progressAdviceService.approveAdvice(advice, pc.passcode,pc.comment).then(handleApproveAdviceSuccess).catch(handleApproveAdviceFail);
                            function handleApproveAdviceSuccess(response){
                                if (response.status==='FAILED') {
                                    /*pc.failed='Pass code Not Matching';*/
                                    Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                                } else {
                                    //updateAdviceInScope(response.data);
                                    pc.hidePasscodeEntry=true;
                                    pc.hideDisburseDate = false;
                                    $rootScope.refreshed = true;
                                    $uibModalInstance.dismiss();
                                    if( !onlyVerifyPassCode ) {
                                        $timeout(function () {
                                            $rootScope.$broadcast('updateAdviceCount');

                                            if(afterApprove) {
                                                afterApprove();
                                            }
                                            if(response.data.adviceStatus!='Disburser Approved'){
                                                updateAdviceInScope(response);
                                            }else{
                                                updateAdviceInScopeForDisburser(response);
                                            }

                                        },500);
                                    }else {
                                        if(afterApprove) {
                                            afterApprove();
                                        }
                                    }
                                }
                            }
                            function handleApproveAdviceFail(error){
                                console.log(error);
                            }
                        }
                        else {
                            Flash.create('danger', $filter('translate')('passcode.mandatoryField'),'approveFlashMsgDiv');
                        }

                    }
                    pc.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');
                    }
                },
                controllerAs:'pc'
            });
        }

        /**
         * This function update the advice status
         * @param paymentAdviceObj
         * @param passCode
         * @param comment
         * @returns {*}
         */
        function submitAdviceRecord(paymentAdviceObj,passCode,comment){
            var deferred = $q.defer();
            var queryParams={
                passCode:passCode,
                _id: paymentAdviceObj._id,
                status:paymentAdviceObj.adviceStatus,
                comment:comment
            };
            var query = angular.extend({},queryParams);
            api.postAdvice({q:query}).$promise.then(insertAdviceSuccessfully).catch(insertAdviceFailed);
            function insertAdviceSuccessfully(response) {
                $rootScope.$broadcast('updateAdviceCount');
                deferred.resolve(response);
            }
            function insertAdviceFailed(error) {
                deferred.reject(error)
            }
            return deferred.promise;
        }


        //function for opening passcode modal and calling approve function
        function voidAdvicePasscodeModal(advice, afterVoid) {
            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/passcode.html'),
                controller: function ($uibModalInstance,progressAdviceService,$state,Flash,$timeout) {
                    var pc=this;
                    pc.advice = advice;
                    pc.hideDisburseDate = true;
                    pc.hidePasscodeEntry = false;
                    pc.medatoryMark ="mandatory-mark";
                    pc.approveAdviceWithPasscode = voidAdviceWithPasscode;
                    function voidAdviceWithPasscode(){
                        progressAdviceService.voidAdvice(advice, pc.passcode, pc.comment).then(handleVoidAdviceSuccess).catch(handleVoidAdviceFail);
                        function handleVoidAdviceSuccess(response){
                            if (response.status==='FAILED') {
                                if(response.messages=="Comment is mandatory") {
                                    Flash.create('danger', $filter('translate')('advice.void.comment.mandatory'),'approveFlashMsgDiv');
                                } else {
                                    Flash.create('danger',$filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                                }
                            } else {
                                pc.hidePasscodeEntry = true;
                                pc.hideDisburseDate = false;
                                $rootScope.refreshed = true;
                                $uibModalInstance.dismiss();
                                $timeout(function () {
                                    $rootScope.$broadcast('updateAdviceCount');
                                    if(afterVoid) { afterVoid(); }
                                },500);
                            }
                        }
                        function handleVoidAdviceFail(error){
                            console.log(error);
                        }
                    }
                    pc.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');
                    }
                },
                controllerAs:'pc'
            });
        }

        //function for opening passcode modal and calling reject function
        function rejectAdvicePasscodeModal(advice,afterReject) {
            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/rejectAdvice.html'),
                controller: function ($scope,$uibModalInstance,paymentAdvice) {
                    $scope.advice = advice;
                    $scope.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                    $scope.rejectAdvice = function () {
                        var uibModalInstance = $uibModal.open({
                            template: require('../../../partials/passcode.html'),
                            controller: function ($uibModalInstance,progressAdviceService,$state,Flash,$timeout) {
                                var pc=this;
                                pc.advice=advice;
                                pc.hidePasscodeEntry=false;
                                pc.hideDisburseDate = true;
                                pc.rejectAdvice='Reject';
                                var passcode=pc.passcode;
                                pc.medatoryMark ="mandatory-mark";
                                pc.approveAdviceWithPasscode=approveAdviceWithPasscode;

                                function approveAdviceWithPasscode(){
                                    if(pc.form.$valid){
                                        progressAdviceService.rejectAdvice(advice,pc.passcode,pc.comment).then(handleRejectAdviceSuccess).catch(handleRejectAdviceFail);
                                        function handleRejectAdviceSuccess(response){
                                            if(response.status=='FAILED'){
                                                if(response.messages=="Comment is mandatory"){
                                                    Flash.create('danger', $filter('translate')('advice.reject.comment.mandatory'),'approveFlashMsgDiv');
                                                }
                                                else{
                                                    Flash.create('danger',$filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                                                }
                                            }else{
                                                pc.hidePasscodeEntry=true;
                                                $rootScope.refreshed = true;
                                                $uibModalInstance.dismiss();
                                                $timeout(function () {
                                                    $rootScope.$broadcast('updateAdviceCount');
                                                    /*updateAdviceInScope(response);*/
                                                    if(afterReject) {
                                                        afterReject();
                                                    }
                                                },500);
                                            }
                                        }
                                        function handleRejectAdviceFail(error){
                                            console.log(error);
                                        }
                                    }
                                    else {
                                        Flash.create('danger',$filter('translate')('passcode.mandatoryField'),'approveFlashMsgDiv');
                                    }
                                }

                                pc.closePopup = function () {
                                    $uibModalInstance.dismiss('cancel');
                                }
                            },
                            controllerAs:'pc'

                        });
                        $uibModalInstance.dismiss('cancel');

                    }
                }
            });
        }
        //function for opening passcode modal and calling disburse function
        function disburseredAdvicePasscodeModal(advice,afterDisbursement) {
            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/passcode.html'),
                controller: function ($uibModalInstance,progressAdviceService,$state,$timeout,Flash) {
                    var pc=this;
                    pc.advice=advice;
                    pc.hidePasscodeEntry=false;
                    pc.hideDisburseDate = false;
                    var passcode=pc.passcode;
                    if(pc.advice.disburserDate && !moment(pc.advice.disburserDate,$rootScope.dateFormate).isValid()) {
                        pc.disbursementDate = moment(pc.advice.disburserDate).format($rootScope.dateFormate);
                    }
                    else {
                        pc.disbursementDate = moment(new Date()).format($rootScope.dateFormate);
                    }
                    pc.approveAdviceWithPasscode=approveAdviceWithPasscode;
                    function approveAdviceWithPasscode(){
                        if(pc.form.$valid){
                            progressAdviceService.disburseAdvice(advice,pc.passcode,pc.comment,pc.disbursementDate).then(handleApproveAdviceSuccess).catch(handleApproveAdviceFail);
                            function handleApproveAdviceSuccess(response){
                                if(response.status=='FAILED'){
                                    Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                                }else{
                                    Flash.create('success',$filter('translate')('advice.disbursed.success'),'approveFlashMsgDiv');
                                    pc.hidePasscodeEntry=true;
                                    $uibModalInstance.dismiss();
                                    $rootScope.refreshed = true;
                                    $timeout(function () {
                                        $rootScope.$broadcast('updateAdviceCount');
                                        if(afterDisbursement) {
                                            afterDisbursement();
                                        }
                                    },500);
                                }
                            }
                            function handleApproveAdviceFail(error){
                                console.log(error);
                            }
                        }
                        else {
                            Flash.create('danger', $filter('translate')('passcode.mandatoryField'),'approveFlashMsgDiv');
                        }
                    }
                    pc.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');

                    }

                },
                controllerAs:'pc'

            });
        }
        //function for approve advice
        function approveAdvice(advice,passCode,comment) {
            var queryParams={
                passCode:passCode,
                _id: advice._id,
                status:advice.adviceStatus,
                comment:comment
            };
            var query = angular.extend({},queryParams);
            return api.approveAdvice({q:query,id:query._id}).$promise;
        }
        //function for disburse advice
        function disburseAdvice(advice,passCode,comment,disbursementDate) {
            var queryParams={
                passCode:passCode,
                _id: advice._id,
                status:advice.adviceStatus,
                comment:comment,
                disbursementDate:disbursementDate
            };
            var query = angular.extend({},queryParams);
            return api.approveAdvice({q:query,id:query._id}).$promise;
        }
        //function for reject advice
        function rejectAdvice(advice, passCode, comment) {

            var queryParams={
                passCode:passCode,
                _id: advice._id,
                status:advice.adviceStatus,
                comment:comment
            };
            var query = angular.extend({},queryParams);
            return api.rejectAdvice({q:query,id:query._id}).$promise;
        }
        //function for void advice
        function voidAdvice(advice, passCode, comment) {

            var queryParams={
                passCode:passCode,
                _id: advice._id,
                status:advice.adviceStatus,
                comment:comment
            };
            var query = angular.extend({},queryParams);
            return api.voidAdvice({q:query,id:query._id}).$promise;
        }


        /*Checks whether advice is valid or not*/
        function validateDisbursedAdvice(advice) {
            //validate disbursed advices payment type required field
            if(advice.type==undefined || advice.type==null){
                return false;
            }else if(advice.type==='Cheque' && (advice.chequeNumber == undefined || advice.bank==undefined)){
                return false;
            }else if((advice.type==='RTGS' || advice.type==='NEFT') && (advice.bank == undefined || advice.chequeNumber == undefined )){
                return false;
            }else if((advice.type==='Credit Card' || advice.type==='Debit Card') && advice.bank==undefined){
                return false;
            }else if(advice.requestedAmount==undefined){
                return false;
            }else if(advice.type==='Cash' && advice.others <= 0){
                return false;
            }
            return true;
        }
        function deleteAdviceModal(advice,afterDeleting){
           /* $uibModal.open({
                template: require('../../../partials/deleteAdvice.html'),
                controller: function UIModalController($scope, $uibModalInstance,Flash,progressAdviceService) {
                    $scope.deleteAdviceDetail = function () {*/
                        var uibModalInstance = $uibModal.open({
                            template: require('../../../partials/advices/advicePasscodeConfirm.html'),
                            controller: function ($uibModalInstance,progressAdviceService,$state,Flash,$timeout) {
                                var pc=this;
                                pc.advice=advice;
                                pc.hidePasscodeEntry=false;
                                pc.hideDisburseDate = false;
                                var passcode=pc.passcode;
                                pc.adviceActionWithPasscode=adviceActionWithPasscode;

                                function adviceActionWithPasscode(){
                                    progressAdviceService.deleteAdvice({id:advice._id,passcode:pc.passcode}).then(deleteAdviceSuccess).catch(deleteAdviceFail);
                                    function deleteAdviceSuccess(response){
                                        if(response.status==304){
                                            Flash.create('danger',$filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                                        }else if(response.status == 200){
                                            $rootScope.$broadcast('updateAdviceCount');
                                            $rootScope.refreshed = true;
                                            $uibModalInstance.close();
                                            afterDeleting();
                                        }
                                        else {
                                            Flash.create('danger',$filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                                        }
                                    }
                                    function deleteAdviceFail(error){
                                        console.log(error);
                                    }
                                }
                                pc.closePopup = function () {
                                    $uibModalInstance.dismiss('cancel');
                                }
                            },
                            controllerAs:'pc'

                        });
                   /* };
                    $scope.cancle=function(){
                        $uibModalInstance.close();
                    }
                }

            });*/
        }

        function deleteAdvice(query){
            return api.deleteAdvice({q:query}).$promise;
        }
    }
}());
