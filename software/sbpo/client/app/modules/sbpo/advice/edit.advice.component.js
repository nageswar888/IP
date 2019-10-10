'use strict';
(function(){
    angular.module('sbpo.advice').component('editAdvice',{
        bindings: {
            advice: '='
        },
        template: require('../../../partials/advices/editDisbursedAdvice.html'),
        controller:editAdviceController,
        controllerAs:'eac'
    });
    editAdviceController.$inject=['passUtilsService', '$rootScope', 'customType', 'paymentAdvice', '$state',
        'addBankService', 'Flash', '$filter', 'Regexes', '$scope', 'validation','virtualLedgerService','$uibModal','ledgerType','paymentMode'];

    function editAdviceController(passUtilsService, $rootScope, customType, paymentAdvice, $state, addBankService,
                                  Flash, $filter, Regexes, $scope, validation,virtualLedgerService,$uibModal,ledgerType,paymentMode){
        var vm=this;
        vm.allBanks = [];
        vm.limit = validation.comments.maxLimit;
        vm.validation = validation;
        vm.paymentTypes = passUtilsService.populateCustomFields(customType.PAYMENT_TYPE);
        vm.categories = passUtilsService.populateCustomFields(customType.CATEGORY);
        vm.paymentModes = $rootScope.getpaymentModes();
        vm.advicePriority = paymentAdvice.getAdvicePriority();
        vm.validChequeNumber = Regexes.CHEQUE_NO_PATTERN;
        vm.amtMaxLength = validation.advice.create.amount.maxLength;
        vm.sourceAmount=false;
        if(vm.advice) {
            //requestedBy: queryParam.requestedBy,
            //initiatedBy: queryParam.initiatedBy,
            //vm.advice.accNo =  vm.advice.accountNumber;
            //vm.advice.selectedProject = vm.advice.project;

            //vm.advice.paymentType = vm.advice.paymentType ? vm.advice.paymentType._id : '';
            //vm.advice.category = vm.advice.category ? vm.advice.category._id : '';
            //vm.advice.disburserDate = moment(new Date(vm.advice.disburserDate)).format($rootScope.dateFormate)
            if(vm.advice.bank) {
                vm.allBanks.push({accountName:vm.advice.bank.accountName,_id:vm.advice.bank._id});
                vm.advice.bank = vm.advice.bank._id;
            }
        }
        vm.setPaymentModeHidenValueEmpty = setPaymentModeHidenValueEmpty;
        vm.showBankLabel = showBankLabel;
        vm.showChequeLabel = showChequeLabel;
        vm.getAllPayees = getAllPayees;
        vm.getAllProjects = getAllProjects;
        vm.getAllBanks = getAllBanks;
        vm.cancelEditDisbursement = cancelEditDisbursement;
        vm.saveAdvice = saveAdvice;
        vm.amountDueNumToText = amountDueNumToText;
        vm.getAllVirtualLedgers=getAllVirtualLedgers;
        vm.addNewLedger=addNewLedger;
        vm.getFullName = getFullName;
        vm.limitChange = limitChange;

        $scope.$watch('eac.advice.others', function(newValue, oldValue) {//Display Number out of range in text-danger
            if(newValue) {
                vm.val = $filter('filterAmount')(newValue);
                if(vm.val.indexOf("Number out of range!")>=0) {
                    vm.invalidCashAmount = true;
                }else {
                    vm.invalidCashAmount = false;
                }
            }
        });
        function amountDueNumToText(value) {
            vm.amountDueNumToTexts =  passUtilsService.convertINRToWord(value);
            if(value > 0){
                vm.sourceAmount=false;
            }
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
         * function for showing limited message
         * @param limit
         */
        function limitChange(limit){
            vm.limit=limit;
        }
        /**
         * @desc set the payment mode hidden value as empty
         * */
        function setPaymentModeHidenValueEmpty() {
            vm.advice.cashAmt = "";
            vm.advice.chequeNumber="";
            vm.advice.debitCardNumber = "";
            vm.advice.bank=null;
            vm.advice.accNo = "";
            vm.advice.transId = "";
            vm.advice.creditCardNumber="";
        }

        function showBankLabel(selectPaymentMode){
            if(selectPaymentMode===paymentMode.DEBIT_CARD || selectPaymentMode===paymentMode.CREDIT_CARD ||
                selectPaymentMode===paymentMode.CHEQUE || selectPaymentMode===paymentMode.RTGS || selectPaymentMode===paymentMode.NEFT || selectPaymentMode === paymentMode.DEBIT_BY_BANK){
                return true;
            }
        }

        function showChequeLabel(selectPaymentMode){
            return !!(selectPaymentMode === paymentMode.CHEQUE || selectPaymentMode === paymentMode.RTGS || selectPaymentMode === paymentMode.NEFT);
        }

        /*
         * fetch all payees by name
         * */
        function getAllPayees(searchTerm) {
            paymentAdvice.getPayeesByName({payeeName:searchTerm}).then(handleReadPayeesSuccess).catch(handleReadPayeesFailure);
            function handleReadPayeesSuccess(response) {
                vm.payees=response.data;
            }
            function handleReadPayeesFailure(error){
                console.log(error);
            }
        }

        /*
         * fetch all projects by name
         * */
        function getAllProjects(searchTerm) {
            paymentAdvice.getProjectsByName({projectName:searchTerm}).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                vm.projects=response.data;
            }
            function handleReadProjectsFailure(error){
                console.log(error);
            }
        }

        /*Goto view advice page*/
        function cancelEditDisbursement(){
            $state.go('viewAdviceDetail', {id:vm.advice._id}, {reload: true});
        }

        function getAllBanks(searchTerm) {
            addBankService.getAllBanks({accountName:searchTerm,modeOfPayment:vm.advice.type}).then(adminBankSuccess).catch(adminBankFailure);
            function adminBankSuccess(success){
                vm.allBanks = success.data
            }
            function adminBankFailure(failure){
            }
        }

        /**
         * Edit the advice and create versions
         * @param paymentAdviceObj
         * @param isSaveValid
         */
        function saveAdvice(paymentAdviceObj,isSaveValid) {
            vm.isMendatoryFieldsSelected = false;
            vm.isFormSave = true;
            vm.sourceAmount=false;
            if(vm.advice.payee == undefined){
                isSaveValid.payeeName.$error.required = true;
            }else if(vm.advice.requestedAmount == undefined){
                isSaveValid.amt.$error.required = true;
            }else if(vm.advice.selectedProject == undefined && vm.advice.project == undefined){
                isSaveValid.projName.$error.required = true;
            }/*else if(vm.advice.category == undefined || vm.advice.paymentType == undefined){
             console.log("is it comming here")
             isSaveValid.projName.$error.required = true;
             }*/
            else if(vm.advice.type === paymentMode.CASH) {
                if ((!paymentAdviceObj.others || parseInt(paymentAdviceObj.others) === 0) && paymentAdviceObj.disburser) {
                    isSaveValid.cashInHand.$error.required=false
                    vm.sourceAmount = true;
                    isSaveValid.$valid=false;
                }
            }
            console.log("paymentAdviceObj",paymentAdviceObj);

            if(isSaveValid.$valid && vm.advice.requestedAmount != null){
                if(vm.advice.requestedAmount != 0){
                    paymentAdvice.amendDisbursedAdvice(paymentAdviceObj).then(function (res) {
                        if(res.status === 200) {
                            $state.go('viewAdviceDetail', {id:res.data._id,message:$filter('translate')('advice.update.success')}, {reload: true});
                        }
                    },function (error) {
                        console.log(error)
                    })
                }else{
                    Flash.create('danger',$filter('translate')('amount.field.error'),'FlashMsgDiv');
                }
            }else {
                vm.isMendatoryFieldsSelected = true;
                Flash.create('danger',$filter('translate')('advice.form.mandatoryField'),'FlashMsgDiv');
            }
        }
        function getAllVirtualLedgers(searchTerm) {
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
                            virtualLedgerService.saveVirtualLedger([{name : ledger.name,discriminator : "ledger"}]).then(function (res){
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
            console.log(ledger)
            virtualLedgerService.getLedgerByName({name:ledger.name,discriminator :ledgerType.LEDGER}).then(function(response){
                if(response.status=200){
                    vm.advice.ledger=response.data
                }
            },function(error){
                console.log(error)
            });
        }

    }
}());
