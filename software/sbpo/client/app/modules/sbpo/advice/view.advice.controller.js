/**
 * Created by surendra on 26/10/16.
 */
'use strict';
(function () {
    angular.module('sbpo.advice')
        .controller('viewAdviceCtrl',viewAdviceCtrl);
    viewAdviceCtrl.$inject = ['$scope', '$rootScope', 'paymentAdvice', 'passUtilsService', '$cookies',
        '$filter', '$timeout', '$stateParams', 'addBankService', 'Flash', '$state', 'progressAdviceService',
        'customType','validation', 'stamp', 'AclService','$uibModal', 'Regexes', 'account', 'adviceEditType','virtualLedgerService',
        'ledgerType','accountType','$location','$anchorScroll'
    ];

    function viewAdviceCtrl($scope, $rootScope, paymentAdvice, passUtilsService, $cookies, $filter,
                            $timeout, $stateParams, addBankService, Flash, $state, progressAdviceService, customType,validation, stamp,
                            AclService, $uibModal,Regexes, account, adviceEditType,virtualLedgerService,ledgerType,accountType,$location,$anchorScroll) {

        //todo: for level2 approval he will view and edit the payment advice
        var vm = this;
        vm.showSuccessMessage=showSuccessMessage;
        vm.showSuccessMessage();
        vm.editAdvice=editAdvice;
        vm.canEditLedger=false;
        vm.allBanks=[];
        $scope.advice={};
        /* getAllBanks();*/
        vm.graphQuery = $stateParams.graphQuery;
        vm.filterObj = $stateParams.filterObj;
        vm.resultsView = $stateParams.resultsView;
        vm.editType = $stateParams.editType;
        vm.validChequeNumber = Regexes.CHEQUE_NO_PATTERN;
        vm.validAmount = Regexes.AMOUNT_PATTERN;
        vm.amtMaxLength = validation.advice.create.amount.maxLength;
        vm.limit = validation.comments.maxLimit;
        vm.bankLabels = account.BANK_LABELS;
        vm.checkLabels = account.CHEQUE_LABELS;
        vm.cashLabel = account.CASH;
        vm.adviceEditType = adviceEditType;
        vm.accountType = accountType;
        vm.paymentModes=paymentAdvice.getAllPaymentModes();
        vm.advicePriority = paymentAdvice.getAdvicePriority();
        vm.canEdit = false;
        vm.canEditUrgent = false;
        vm.canEditDisbursed = false;
        vm.isEditingDisbursedAdvice = false;
        vm.sourceAmount=false;
        vm.submitComment=submitComment;
        vm.getCommentsPerAdvice=getCommentsPerAdvice;
        vm.approveModal=approveModal;
        vm.disburseredModal=disburseredModal;
        vm.checkShowEditable=checkShowEditable;
        vm.checkShowApproveButton=checkShowApproveButton;
        vm.editDisbursedAdvice = editDisbursedAdvice;
        vm.backToSearch = backToSearch;
        vm.hasEditableRoles=hasEditableRoles;
        vm.getFullName = getFullName;
        vm.viewPayee = viewPayee;
        vm.getAllPayees = getAllPayees;
        vm.getAllProjects = getAllProjects;
        vm.resetPaymentModeValues = resetPaymentModeValues;
        vm.showBankLabel = showBankLabel;
        vm.showChequeLabel = showChequeLabel;
        vm.amountDueNumToText = amountDueNumToText;
        vm.submitModal = submitModal;
        vm.limitChange = limitChange;
        vm.getAllVirtualLedgers=getAllVirtualLedgers;
        vm.getProjectFullName=getProjectFullName;
        vm.addNewLedger=addNewLedger;
        vm.getAllBanks = getAllBanks;
        vm.scrollDown = scrollDown;

        getPaymentTypes();
        viewAdvice($stateParams.id);


        //function for showing success messages
        function showSuccessMessage(){
            if($stateParams.message){
                Flash.create('success',$stateParams.message,'FlashMsgDiv');
            }
        }

        /**
         * This function will fetch all payment types and categories at once
         */
        function getPaymentTypes() {
            $timeout(function(){
                vm.paymentTypes = passUtilsService.populateCustomFields(customType.PAYMENT_TYPE);
                vm.categories = passUtilsService.populateCustomFields(customType.CATEGORY);
            },500)
        }

        /**
         * function for showing limited message
         * @param limit
         */
        function limitChange(limit){
            vm.limit=limit;
        }

        /**
         * This function will convert number into words
         * @param value
         */
        function amountDueNumToText(value) {
            vm.amountDueNumToTexts =  passUtilsService.convertINRToWord(value);
            if(value > 0){
                vm.sourceAmount=false;
            }
        }

        /**
         * This function verify banks label
         * @param selectPaymentMode
         * @returns {boolean}
         */
        function  showBankLabel(selectPaymentMode){
            if(account.BANK_LABELS.indexOf(selectPaymentMode) !== -1) {
                return true;
            }
        }

        /**
         * This function verify cheque label
         * @param selectPaymentMode
         * @returns {boolean}
         */
        function showChequeLabel(selectPaymentMode){
            return (account.CHEQUE_LABELS.indexOf(selectPaymentMode)!== -1);
        }

        /**resetPaymentModeValues
         * @desc set the payment mode hidden value as empty
         */
        function resetPaymentModeValues() {
            vm.advice.cashAmt = "";
            vm.advice.chequeNumber="";
            vm.advice.debitCardNumber = "";
            vm.advice.bank=null;
            vm.advice.accNo = "";
            vm.advice.transId = "";
            vm.advice.creditCardNumber="";
            vm.advice.debitByBank="";
        }

        /**
         * This function will fetch all payees which matches the search term
         * @param searchTerm
         */
        function getAllPayees(searchTerm) {
            paymentAdvice.getPayeesByName({payeeName:searchTerm}).then(handleReadPayeesSuccess).catch(handleReadPayeesFailure);
            function handleReadPayeesSuccess(response) {
                vm.payees=response.data;
                //vm.payees = $filter('orderBy')(vm.payees, 'nickName');
            }
            function handleReadPayeesFailure(error){
                console.log(error);
            }
        }

        /**
         * This function will fetch all project which matches the search term
         * @param searchTerm
         */
        function getAllProjects(searchTerm) {
            if(searchTerm.length === 0){
                getProjectFullName(searchTerm)
            }
            paymentAdvice.getProjectsByName({projectName:searchTerm}).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                vm.projects=response.data;
            }
            function handleReadProjectsFailure(error){
                console.log(error);
            }
        }

        /**
         * This function will render the payee details (only for disburser role)
         * @param payee
         */
        function viewPayee(payee) {
            $uibModal.open({
                size:'lg',
                template:require('../../../partials/payee/viewPayee.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash,$timeout){
                    $scope.payee = angular.copy(payee);

                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }


                },
                windowClass: 'app-modal-window'
            });
        }

        /**
         * This function will return full name of user
         * @param user
         * @returns {string}
         */
        function getFullName(user) {
            return passUtilsService.getUserFullName(user);
        }

        /**
         * This function checks user having edit privilege or not  based on the role
         * @returns {boolean}
         */
        function hasEditableRoles(){
            return !(AclService.hasAnyRole(['ROLE_PAYEE']));
        }
        vm.paymentModes = $filter('orderBy')( vm.paymentModes, 'value');
        $timeout(function(){
            vm.paymentTypes = $filter('orderBy')( vm.paymentTypes, 'value');
            vm.categories = $filter('orderBy')( vm.categories, 'value');
        }, 100);
        vm.isDisburser = $rootScope.isDesRole();

        /**
         * This function returns to the search view
         */
        function backToSearch() {
            $state.go('searchAdvice',{graphQuery: vm.graphQuery, filterObj: vm.filterObj, resultsView: vm.resultsView})
        }

        /**
         * This function will scroll to div which having id as commentId
         */
        function scrollDown() {
            $location.hash('commentId');
            $anchorScroll();
        }

        /**
         * This function checks user having privilege to edit disbursed advice
         */
        function canEditDisbursed() {
            if($scope.advice.adviceStatus === $rootScope.adviceStatusDisbursed[0] &&
                (AclService.hasRole(['ROLE_MASTERADMIN']))) {
                vm.canEditDisbursed = true;
            }
        }

        /**
         * This function render the view (editAdvice/editDisbursedAdvice) based on the conditions
         */
        function editDisbursedAdvice(){
            var submitLabel=$filter('translate')('button.submit');
            vm.adviceDetails = {_id:vm.advice._id};
            passUtilsService.verifyPasscodeModal(vm.adviceDetails, function(comment) {
                if(vm.advice.adviceStatus === $rootScope.adviceStatusDisbursed[0] && vm.canEditDisbursed) {
                    if(comment){
                        viewAdvice(vm.adviceDetails._id);
                    }
                    vm.isEditingDisbursedAdvice = true;
                    vm.hideViewAdvice = true;
                }
                else {//if advice is not disbursed
                    vm.isEditingDisbursedAdvice = false;
                    $state.go('viewAdviceDetail',
                        {id: $stateParams.id, editType:adviceEditType.EDIT_ADVICE});
                }
            }, true,{},submitLabel);
        }

        /**
         * This function will fetch all banks which matches the search term
         * @param searchTerm
         */
        function getAllBanks(searchTerm) {
            addBankService.getAllBanks({accountName:searchTerm,modeOfPayment:vm.advice.type}).then(adminBankSuccess).catch(adminBankFailure);
            function adminBankSuccess(success){
                vm.allBanks = success.data
            }
            function adminBankFailure(failure){
                console.log("getAllBanks error",failure)
            }
        }

        /**
         * This function will render the advice details for edit
         * @param id
         */
        function viewAdvice(id) {
            console.log("is it getting call or not:");
            paymentAdvice.viewAdvice(id, true).then(success).catch(failed);
            function success(success){
                $scope.advice=success.data;
                vm.advice=success.data;
                vm.showPriority = (vm.advice.urgent) ? "High-priority" : 'Not set';
                vm.showPaymentType = (success.data.paymentType) ? success.data.paymentType.name : 'Not provided';
                vm.showCategory = (success.data.category) ? success.data.category.name : 'Not provided';
                //vm.getCommentsPerAdvice();
                if(vm.advice) {
                    if(vm.advice.disburserDate !== undefined && vm.advice.disburserDate !== null) {
                        vm.advice.disburserDate = moment(new Date(vm.advice.disburserDate)).format($rootScope.dateFormate)
                    }
                    else {
                        vm.advice.disburserDate = moment(new Date()).format($rootScope.dateFormate);
                    }

                    if(vm.advice.bank && vm.editType === adviceEditType.EDIT_ADVICE) {
                        vm.allBanks.push({accountName:vm.advice.bank.accountName,_id:vm.advice.bank._id});
                        vm.advice.bank = vm.advice.bank._id;
                    }
                    vm.advice.paymentType = vm.advice.paymentType ? vm.advice.paymentType._id : '';
                    vm.advice.category = vm.advice.category ? vm.advice.category._id : '';
                }

                //can edit
                checkShowEditable();
                canEditDisbursed();
                checkShowApproveButton();
                checkShowDisburseButton();
                if(vm.advice.organization.stamp){
                    angular.forEach(vm.advice.organization.stamp,function(data){
                        if(data.type===stamp.COMPANY_STAMP){
                            vm.companyStamp = data;
                        }else if(data.type===stamp.APPROVED_STAMP){
                            vm.approvedStamp = data;
                        }else if(data.type===stamp.REJECTED_STAMP){
                            vm.rejectedStamp = data;
                        }else if(data.type===stamp.VOID_STAMP){
                            vm.voidStamp = data;
                        }else{
                            vm.disbursedStamp = data;
                        }
                    })
                }

                /*To show validation msg on load*/
                if($stateParams.showValidation) {
                    disburseredModal($scope.advice);
                }
            }


            function failed(){
            }
        }

        /**
         * This function checks user having privileges to edit advice
         */
        function checkShowEditable(){
            vm.canEdit = passUtilsService.canEditAdvice(vm.advice);
        }

        /**
         * This function show the approve button based on the user privileges
         */
        function checkShowApproveButton(){
            vm.canApprove = passUtilsService.canApproveAdvice(vm.advice);
        }

        /**
         * This function show the disburse button based on the user privileges
         */
        function checkShowDisburseButton(){
            vm.canDisburse = passUtilsService.canDisburseAdvice(vm.advice);
        }

        /**
         * This function render the approve advice modal
         * @param advice
         */
        function approveModal(advice) {
            if(advice.chequeNumber && advice.chequeNumber.toString().length > 15) {
                Flash.create('danger',  $filter('translate')('invalid.chequeno.validation'),'FlashMsgDiv');
            } else {
                progressAdviceService.approveAdvicePasscodeModal(advice, function() {
                    $state.reload();
                    $state.go('viewAdviceDetail', {id: $stateParams.id, message:$filter('translate')('advice.approved.success')});
                });
            }
        }

        /**
         * This function render the submit advice modal
         * @param advice
         */
        function submitModal(advice) {
            /*                progressAdviceService.submitAdvicePasscodeModal(advice, function() {
             $state.reload();
             },true);*/

            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/passcode.html'),
                controller: function ($uibModalInstance,progressAdviceService,$state,Flash,$timeout) {
                    var pc=this;
                    pc.advice=advice;
                    pc.hidePasscodeEntry=false;
                    pc.submitModal = true;
                    pc.submitAdviceWithPasscode = submitAdviceWithPasscode;
                    function submitAdviceWithPasscode(){
                        if(pc.form.$valid){
                            progressAdviceService.submitAdviceRecord(advice, pc.passcode,pc.comment).then(handleApproveAdviceSuccess).catch(handleApproveAdviceFail);
                        }
                        else {
                            Flash.create('danger', $filter('translate')('passcode.mandatoryField'),'approveFlashMsgDiv');
                        }
                        function handleApproveAdviceSuccess(response){
                            if (response.status===403) {
                                Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'approveFlashMsgDiv');
                            }
                            else if(response.status === 500) {
                                Flash.create('danger', $filter('translate')(response.messages),'approveFlashMsgDiv');
                            }
                            else {
                                pc.hidePasscodeEntry=true;
                                $rootScope.refreshed = true;
                                $uibModalInstance.dismiss();
                                $state.go('viewAdviceDetail', {id: $stateParams.id,message:$filter('translate')('advice.submit.success')});
                            }
                        }
                        function handleApproveAdviceFail(error){
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

        /**
         * This function render the disburse advice modal
         * @param advice
         */
        function disburseredModal(advice) {
            var isValidate = progressAdviceService.validateDisbursedAdvice(advice);
            if(isValidate) {
                if( advice.chequeNumber && advice.chequeNumber.toString().length > 15 ){
                    Flash.create('danger',  $filter('translate')('invalid.chequeno.validation'),'FlashMsgDiv');
                } else {
                    progressAdviceService.disburseredAdvicePasscodeModal(advice, function () {
                        /*$state.go('viewAdviceDetail', {id: $stateParams.id, message:$filter('translate')('dvice.disbursed.success')});*/
                        $state.go('viewAdviceDetail', {id:$stateParams.id, message:$filter('translate')('advice.disbursed.success'),showValidation:false});
                    });
                }
            } else {
                Flash.create('danger',  $filter('translate')('advice.update.required.error.message'),'FlashMsgDiv');
            }
        }

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd/MM/yyyy', 'shortDate','d MMM y'];
        $scope.format = $scope.formats[4];
        $scope.opened = {};

        $scope.open = function($event, elementOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened[elementOpened] = !$scope.opened[elementOpened];
        };


        /**
         * This function update the advice details
         * @param advice
         */
        function editAdvice(advice){
            vm.validForm = false;
            if(vm.amendAdviceForm.$valid && advice.requestedAmount !=0 && advice.billAmountDue !=0 &&
                (!advice.chequeNumber || advice.chequeNumber.toString().length <= validation.CHEQUE_NUMBER_MAX_LENGTH )) {
                vm.validForm = true;
                vm.sourceAmount=false;
            }
            else {
                if(advice.requestedAmount ===0) {
                    vm.amendAdviceForm.amt.$error.pattern = true;
                    vm.validForm = false;
                }
                if(advice.billAmountDue ===0) {
                    vm.amendAdviceForm.dueAmount.$error.pattern = true;
                    vm.validForm = false;
                }
            }
            if(vm.advice.payee == undefined){
                console.log("payee.......................undefined",vm.advice.payee)
                vm.amendAdviceForm.payeeName.$error.required = true;
                vm.validForm = false;
            }else if(vm.advice.requestedAmount == undefined){
                console.log("requestedAmount.......................undefined",vm.advice.requestedAmount)
                vm.amendAdviceForm.amt.$error.required = true;
            }else if(vm.advice.project == undefined){
                console.log("project.......................undefined",vm.advice.project)
                vm.amendAdviceForm.projName.$error.required = true;
                vm.validForm = false;
            }
            else if(vm.advice.adviceNumber === undefined || advice.adviceNumber === ''){
                console.log("adviceNumber.......................undefined",vm.advice.adviceNumber)
                vm.validForm = false;
            }
            else if(vm.advice.type ===  vm.cashLabel) {
                console.log("type")
                console.log(typeof advice.others)
                console.log("type")
                if ((!advice.others || parseInt(advice.others) === 0 )&& advice.thirdLevelApprover) {
                    vm.amendAdviceForm.cashInHand.$error.required=false
                    vm.sourceAmount = true;
                    vm.validForm = false;
                }
            }
            if(vm.validForm && vm.amendAdviceForm.$valid) {
                var query = paymentAdvice.prepareEditAdviceQuery(advice);
                $timeout(function(){
                    paymentAdvice.updateAdvice(query).then(updateAdviceSuccess).catch(updateAdviceFailure);
                    function updateAdviceSuccess(response) {
                        if(response.status == 200) {
                            //vm.getCommentsPerAdvice();
                            Flash.create('success',  $filter('translate')('advice.update.success'),'FlashMsgDiv');
                            $state.reload();
                            $state.go('viewAdviceDetail', {id: $stateParams.id, editType:'viewAdvice'});
                        }
                        else if(response.status == 500){
                            Flash.create('danger',  $filter('translate')(response.messages),'FlashMsgDiv');
                        }
                    }
                    function updateAdviceFailure(error){
                        console.log(error);
                    }

                },600);
            }
        }

        /**
         * This function will add new comment to advice
         * @param adviceId
         */
        function submitComment(adviceId){
            var currentUser = $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);
            var query={
                adviceId:adviceId,
                text:vm.text,
                userId:currentUser._id,
                date:new Date()
            };

            if(vm.viewAdviceForm.$valid) {
                paymentAdvice.saveComment(query).then(saveCommentSuccess).catch(saveCommentFailure);
            }

            function saveCommentSuccess(response) {
                vm.getCommentsPerAdvice();
            }
            function saveCommentFailure(error){
                console.log(error);
            }
            vm.text="";

        }

        /**
         * This function will fetch all comments associated with advice
         */
        function getCommentsPerAdvice(){
            var query={
                adviceId:vm.advice._id
            };
            paymentAdvice.getCommentsByAdvice(query).then(getCommentSuccess).catch(getCommentFailure);
            function getCommentSuccess(response) {

                if(response.data.length==0){
                    vm.comments=null;
                }else{
                    vm.advice.comments = response.data;
                }


            }
            function getCommentFailure(error){
                console.log(error);

            }
        }
        function getAllVirtualLedgers(searchTerm) {
            console.log(searchTerm)
            virtualLedgerService.getVirtualLedgersByName({name:searchTerm,type:"ledger"}).then(successCallback).catch(errorCallback);
            function successCallback(response) {
                if(response.status == 200) {
                    vm.virtualLedgerOptionNames = $filter('orderBy')(response.data, 'name');
                } else {
                    vm.virtualLedgerOptionNames = []
                }
            }
            function errorCallback(error){
                console.log(error);
            }
        }
        function getProjectFullName(projectName) {
            vm.hovered=passUtilsService.getProjectFullName(projectName)
            console.log(vm.hovered)
        }
        function addNewLedger() {
            $uibModal.open({
                template:require('../../../partials/addLedger.html'),
                controller:function ($scope,virtualLedgerService,Flash,$uibModalInstance) {
                    var addLedgerCtrl = $scope;
                    $scope.isMendatoryFieldsSelected = false;
                    $scope.payeeNameMaxLength = validation.payee.firstName.maxLength;
                    $scope.ledgerNameMaxlength = validation.ledger.name.maxLength;
                    $scope.addLedger = function (ledger, validLedgerForm) {
                        if (validLedgerForm.$valid) {
                            virtualLedgerService.saveVirtualLedger([{name : ledger.name,discriminator : "ledger"}]  ).then(function (res){
                                if(res.status===409){
                                    Flash.create('danger', $filter('translate')('ledger.name.invalid'),'ledgerFlashMsgDiv');
                                }else {
                                    Flash.create('success',$filter('translate')('ledger.save.success.message'),'FlashMsgDiv');
                                    getNewLedger(ledger)
                                    $uibModalInstance.close();
                                }
                            },function (error) {
                                Flash.create('danger',$filter('translate')('ledger.save.fail.message'),'ledgerFlashMsgDiv');
                            })
                        }else{
                            if(validLedgerForm.name.$error.required) {
                                addLedgerCtrl.isMendatoryFieldsSelected = true;
                                Flash.create('danger', $filter('translate')('ledger.name.required'),'ledgerFlashMsgDiv');
                            }
                        }
                    }
                    addLedgerCtrl.closeModal=function () {
                        $uibModalInstance.close();
                    }
                }
            })
        }
        function getNewLedger(ledger){
            virtualLedgerService.getLedgerByName({name:ledger.name,discriminator :ledgerType.LEDGER}).then(function(response){
                if(response.status === 200){
                    vm.advice.ledger=response.data
                }
            },function(error){
                console.log(error)
            })
        }

    }
}());
