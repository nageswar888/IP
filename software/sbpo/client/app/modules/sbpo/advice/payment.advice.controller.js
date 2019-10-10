/**
 * Created by surendra on 17/10/16.
 */
'use strict';
(function () {
    angular.module('sbpo.advice')
        .controller('PaymentAdviceController',PaymentAdviceController);
    PaymentAdviceController.$inject = ['$scope','$rootScope', 'paymentAdvice', 'passUtilsService', '$cookies',
        '$state', '$uibModal', 'addBankService', 'Flash', '$filter', 'customType','AclService', '$stateParams',
        'paymentRequestService','Regexes','validation','paymentMode', 'virtualLedgerService','ledgerType','account','states'];

    function PaymentAdviceController($scope,$rootScope, paymentAdvice, passUtilsService, $cookies, $state,
                                     $uibModal, addBankService, Flash, $filter, customType, AclService, $stateParams,
                                     paymentRequestService,Regexes,validation,paymentMode, virtualLedgerService,ledgerType,account,states) {
        var vm = this;
        vm.advice = {};
        vm.advice.requestedDate = passUtilsService.getCurrentDate();
        vm.allBanks = [];
        vm.validChequeNumber = Regexes.CHEQUE_NO_PATTERN;
        var currentUser = $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);
        vm.advice.initiater = currentUser.firstName +" "+currentUser.lastName;
        vm.advice.userId=currentUser._id;
        vm.sucessMsg = false;
        vm.getAllBanks=getAllBanks;
        vm.advicePriority = paymentAdvice.getAdvicePriority();
        vm.nameLength = validation.advice.requestedByName.maxLength;
        vm.purposeLength = validation.advice.purpose.maxLength;
        vm.amtMaxLength = validation.advice.create.amount.maxLength;
        vm.payeeNameMaxLength = validation.payee.firstName.maxLength;
        vm.cash = account.CASH;
        vm.viewStates = states;
        vm.hideProjectName=hideProjectName;
        
        /*constant for Mode of payment related fields
         * */

        /*constant for Mbill payment max size
         * */
        vm.billAmtMaxLength = validation.advice.billAmount.maxLength;

        $rootScope.adviceList=[{}];
        vm.paymentModes = $rootScope.getpaymentModes();
        vm.saveAdvice = saveAdvice;
        vm.setPaymentModeHidenValueEmpty = setPaymentModeHidenValueEmpty;
        vm.setPaymentTypeHidenValueEmpty=setPaymentTypeHidenValueEmpty;
        vm.numberTotext = numberTotext;
        vm.amountDueNumToText = amountDueNumToText;
        vm.submitAdvice = submitAdvice;
        vm.getAllPayees = getAllPayees;
        vm.getAllProjects=getAllProjects;
        vm.getProjectFullName=getProjectFullName
        vm.addNewPayee = addNewPayee;
        vm.addNewLedger=addNewLedger;
        vm.cancelFormdata = cancelFormdata;
        vm.resetFields = resetFields;
        vm.getAllVirtualLedgers = getAllVirtualLedgers;
        vm.showBankLabel=showBankLabel;
        vm.showChequeLabel=showChequeLabel;
        vm.getAllPaymentTypes=getAllPaymentTypes;
        vm.getAllPaymentCategories=getAllPaymentCategories;
        vm.isLegacyUser = AclService.hasRole('LEGACY_DATA_OPERATOR')
            && $state.current.name === 'createLegacyAdvice';
        vm.setRequestedDate = setRequestedDate;
        vm.advice.disburserDate = moment(new Date()).format($rootScope.dateFormate);
        vm.advice.urgent = false;
        vm.paymentRequestObj = null;
        vm.invalidAmount = false;

        String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

        function getAllPaymentTypes() {
            vm.paymentTypes = passUtilsService.populateCustomFields(customType.PAYMENT_TYPE);
        }

        function getAllPaymentCategories() {
            vm.categories = passUtilsService.populateCustomFields(customType.CATEGORY);
        }
        $scope.$watch('pa.advice.requestedAmt', function(newValue, oldValue) {//Display Number out of range in text-danger
            if(newValue) {
                vm.val = $filter('filterAmount')(newValue);
                if(vm.val.contains("Number out of range!")) {
                    vm.invalidAmount = true;
                }else {
                    vm.invalidAmount = false;
                }
            }
        });
        $scope.$watch('pa.advice.billAmountDue', function(newValue, oldValue) {//Display Number out of range in text-danger
            if(newValue) {
                vm.val = $filter('filterAmount')(newValue);
                if(vm.val.contains("Number out of range!")) {
                    vm.invalidBillAmount = true;
                }else {
                    vm.invalidBillAmount = false;
                }
            }
        });
        $scope.$watch('pa.advice.cashAmt', function(newValue, oldValue) {//Display Number out of range in text-danger
            if(newValue) {
                vm.val = $filter('filterAmount')(newValue);
                if(vm.val.indexOf("Number out of range!")>=0) {
                    vm.invalidCashAmount = true;
                }else {
                    vm.invalidCashAmount = false;
                }
            }
        });
        //populate advice object
        if($stateParams.prObj) {
            vm.paymentRequestObj = $stateParams.prObj;
            vm.advice.requestedAmt = vm.paymentRequestObj.amount;
            vm.advice.selectedProject = vm.paymentRequestObj.project;
            vm.advice.payee = vm.paymentRequestObj.payee;
            vm.advice.paymentType = vm.paymentRequestObj.paymentType;
            vm.advice.paymentType.value=vm.paymentRequestObj.paymentType.name
            vm.advice.selectedPurpose = vm.paymentRequestObj.purpose;
            vm.advice.requestedBy = passUtilsService.getUserName(vm.paymentRequestObj.requestedUser);
            vm.advice.isPaymentRequest = true;
            vm.advice.paymentRequestId = vm.paymentRequestObj._id;
        }

        /*console.log("aaaaaaaaaa",vm.paymentRequestObj._id);*/
        function showBankLabel(selectPaymentMode){
            if(selectPaymentMode===paymentMode.CREDIT_CARD || selectPaymentMode=== paymentMode.DEBIT_CARD ||
                selectPaymentMode===paymentMode.CHEQUE || selectPaymentMode===paymentMode.RTGS || selectPaymentMode===paymentMode.NEFT || selectPaymentMode === paymentMode.DEBIT_BY_BANK){
                return true;
            }
        }

        function showChequeLabel(selectPaymentMode){
            return !!(selectPaymentMode === paymentMode.CHEQUE || selectPaymentMode === paymentMode.RTGS || selectPaymentMode === paymentMode.NEFT);
        }

        function setRequestedDate() {
            if(vm.advice.disburserDate) {
                vm.advice.requestedDate = passUtilsService.formatDateString(vm.advice.disburserDate,'dd-MMM-yyyy');
            }
        }

        function numberTotext(value){
            vm.numberTotexts = passUtilsService.convertINRToWord(value);
        }

        function amountDueNumToText(value) {
            vm.amountDueNumToTexts =  passUtilsService.convertINRToWord(value);
        }

        vm.statuses={draft:'Draft',approval:'Approval',reject:'Rejected',approved:'Approved', disbursed: 'Disbursed'};

        /**
         * @desc code for insert payment advice
         *@param {advice} paymentAdviceObj
         *
         * */
        function saveAdvice(paymentAdviceObj,isSaveValid) {
            //TODO: will be implemented as part of save payment advice story.
            vm.isMendatoryFieldsSelected = false;
            vm.isFormSave = true;

            if(vm.advice.payee == undefined){
                isSaveValid.payeeName.$error.required = true;
            }else if(vm.advice.requestedAmt == undefined){
                isSaveValid.amt.$error.required = true;
            }else if(vm.advice.selectedProject == undefined){
                isSaveValid.projName.$error.required = true;
            }

            if(isSaveValid.$valid && vm.advice.requestedAmt!=null){
                if(vm.advice.requestedAmt!=0){
                    vm.advice.status = vm.isLegacyUser ? vm.statuses.disbursed : vm.statuses.draft;
                    paymentAdviceObj.isLegacy = vm.isLegacyUser;
                    if(paymentAdviceObj.ledger) {
                        paymentAdviceObj.ledger = paymentAdviceObj.ledger['_id'];
                    }
                    paymentAdvice.saveAdviceRecord(paymentAdviceObj).then(function (res) {
                        if(res.status==200) {
                            if(vm.isLegacyUser) {
                                var obj={
                                    id:res.data._id,
                                    message:$filter('translate')('advice.disbursed.success')
                                };
                                /*Flash.create('success',$filter('translate')('advice.disbursed.success'),'FlashMsgDiv');*/
                                $state.go('viewAdviceDetail',obj,{reload: true});
                                //resetFields();
                            }else {
                                var obj={
                                    status:"Pending",
                                    message:$filter('translate')('advice.save.success')
                                };
                                //update paymentRequest if advice is created from paymentRequest
                                if(vm.paymentRequestObj) {
                                    paymentRequestService.approvePaymentRequest(vm.paymentRequestObj._id).then(function() {
                                        $state.go('advice.pending-approval',obj,{reload: true});
                                    });
                                }else {
                                    $state.go('advice.pending-approval',obj,{reload: true});
                                }
                            }
                            $rootScope.refreshed = true;
                        }
                    },function (error) {
                        console.log(error)
                    })
                }else{
                    Flash.create('danger',$filter('translate')('amount.field.error'),'FlashMsgDiv');
                }
            }else {
                var formErrors = [];
                if(angular.isArray(isSaveValid.$error.number)) {
                    isSaveValid.$error.number.forEach(function(elem){
                        formErrors.push($filter('translate')('advice.field.invalid.value', {"fieldName": elem.$name}))
                    })
                }

                vm.isMendatoryFieldsSelected = true;
                if(formErrors.length != 0) {
                    if(formErrors.length == 1) {
                        Flash.create('danger',formErrors[0],'FlashMsgDiv');
                    } else {
                        var template = "<ul class='advice-error-type-number'>";
                        formErrors.forEach(function(elem){
                            template = template +"<li>"+elem+"</li>"
                        });
                        template = template +"</ul>";
                        Flash.create('danger', template, 'FlashMsgDiv');
                    }
                } else {
                    Flash.create('danger',$filter('translate')('advice.form.mandatoryField'),'FlashMsgDiv');
                }
            }
        }


        function submitAdvice(paymentAdviceObj,isSubmitValid) {
            //code
            vm.isMendatoryFieldsFormSelected = false;
            vm.isFormSave = true;
            if(vm.advice.payee == undefined){
                isSubmitValid.payeeName.$error.required = true;
            }else if(vm.advice.requestedAmt == undefined){
                isSubmitValid.amt.$error.required = true;
            }else if(vm.advice.selectedProject == undefined){
                isSubmitValid.projName.$error.required = true;
            }

            if(isSubmitValid.$valid && vm.advice.requestedAmt!=null) {
                if(vm.advice.requestedAmt!=0){
                    vm.advice.status = "Submitted";
                    paymentAdviceObj.status = "Submitted";
                    /*if(vm.advice.requestedBy==undefined){
                     vm.advice.requestedBy.name = "";
                     }*/
                    if(paymentAdviceObj.ledger) {
                        paymentAdviceObj.ledger = paymentAdviceObj.ledger['_id'];
                    }
                    paymentAdvice.saveAdviceRecord(paymentAdviceObj).then(function(response){
                        if(response.status==200) {
                            var obj={
                                status:"Inprogress",
                                message:$filter('translate')('advice.submit.success')
                            };
                            if(vm.paymentRequestObj) {
                                paymentRequestService.approvePaymentRequest(vm.paymentRequestObj._id).then(function() {
                                    $rootScope.$broadcast('updatePaymentReqCount');
                                    $state.go('advice.inprogress',obj,{reload: true});
                                });
                            }else {
                                $state.go('advice.inprogress',obj,{reload: true});
                            }
                            $rootScope.refreshed = true;
                        }
                        else {
                            Flash.create('danger',$filter('translate')('save.payment.request.error'),'FlashMsgDiv');
                        }
                    }, function(error) {
                        console.log(error)
                    })
                }else{
                    Flash.create('danger',$filter('translate')('amount.field.error'),'FlashMsgDiv');
                }

            }else {
                var formErrors = [];
                if(angular.isArray(isSubmitValid.$error.number)) {
                    isSubmitValid.$error.number.forEach(function(elem){
                        formErrors.push($filter('translate')('advice.field.invalid.value', {"fieldName": elem.$name}))
                    })
                }

                vm.isMendatoryFieldsSelected = true;
                if(formErrors.length != 0) {
                    if(formErrors.length == 1) {
                        Flash.create('danger',formErrors[0],'FlashMsgDiv');
                    } else {
                        var template = "<ul class='advice-error-type-number'>";
                        formErrors.forEach(function(elem){
                            template = template +"<li>"+elem+"</li>"
                        });
                        template = template +"</ul>";
                        Flash.create('danger', template, 'FlashMsgDiv');
                    }
                } else {
                    Flash.create('danger',$filter('translate')('advice.form.mandatoryField'),'FlashMsgDiv');
                }
            }
        }

        function resetFields() {
            console.log("here rest fields");
            vm.advice.payee = null;
            vm.advice.ledger = null;
            vm.advice.selectedProject= null;
            vm.advice.requestedAmt = "";
            vm.advice.billAmountDue = null;
            vm.advice.requestedBy =null;
            vm.advice.paymentType = "";
            vm.advice.selectPaymentMode = "";
            vm.advice.bank = null;
            vm.advice.chequeNumber = "";
            vm.advice.selectedPurpose = "";
            vm.advice.comment = "";
            vm.advice.requestedDate = passUtilsService.getCurrentDate();
            vm.advice.disburserDate = "";
            $state.reload();
        }
        /*
         * fetch all payees by name
         * */
        function getAllPayees(searchTerm, event) {
            if($rootScope.keyCode.indexOf(event.keyCode) === -1) {
                paymentAdvice.getPayeesByName({payeeName:searchTerm}).then(handleReadPayeesSuccess).catch(handleReadPayeesFailure);
            }
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
        function getAllProjects(searchTerm, event) {
            if(searchTerm.length==0){
                getProjectFullName(searchTerm)
            }
            if($rootScope.keyCode.indexOf(event.keyCode) === -1) {
                paymentAdvice.getProjectsByName({projectName:searchTerm}).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            }
            function handleReadProjectsSuccess(response) {
                vm.projects=response.data;
            }
            function handleReadProjectsFailure(error){
                console.log(error);
            }
        }

        function getAllBanks(searchTerm, event) {
            if($rootScope.keyCode.indexOf(event.keyCode) === -1) {
                addBankService.getAllBanks({accountName:searchTerm,modeOfPayment:vm.advice.selectPaymentMode}).then(adminBankSuccess).catch(adminBankFailure);
            }
            function adminBankSuccess(success){
                vm.allBanks = success.data;
            }
            function adminBankFailure(failure){
            }
        }

        function cancelFormdata() {
            var obj={
                status:"Pending"
            };
            $state.go('advice.pending-approval',obj,{reload: true});


        }

        /**
         * @desc set the payment mode hidden value as empty
         * */
        function setPaymentModeHidenValueEmpty() {
            vm.advice.cashAmt = null;
            vm.advice.chequeNumber="";
            vm.advice.debitCardNumber = "";
            vm.advice.bank=null;
            vm.advice.accNo = "";
            vm.advice.transId = "";
            vm.advice.creditCardNumber="";
        }

        /**
         * @desc onchange set the paymentType hidden value as empty
         * */
        function setPaymentTypeHidenValueEmpty() {
            vm.advice.billAmountDue=null;
        }

        /*
         * Add new Payee
         * */
        function addNewPayee() {
            $uibModal.open({
                template:require('../../../partials/addPayee.html'),
                windowTopClass:'quick-add-payee-modal',
                controller: function($scope,$uibModalInstance,paymentAdvice,addBankService,Flash,$timeout) {
                    var addPayeeCtrl = $scope;
                    var addPayeeForm = {};
                    $scope.isMendatoryFieldsSelected = false;
                    $scope.payeeNameMaxLength = validation.payee.firstName.maxLength;
                    $scope.payeeNickNameMaxLength = validation.payee.nickName.maxLength;


                    $scope.bankNameMaxLength = validation.payee.bankName.maxLength;
                    $scope.bankBranchMaxLength = validation.payee.bankBranch.maxLength;
                    $scope.ifscCodeMaxLength = validation.payee.ifscCode.maxLength;
                    $scope.accountNumMaxLength = validation.payee.accountNo.maxLength;


                    $scope.addPayee = function (payee,isValidPayeeForm) {
                        $scope.addPayeeForm.adminSubmitted = true;
                        if(isValidPayeeForm.$valid) {
                            payee.role = 'ROLE_PAYEE';
                            paymentAdvice.addPayeeRecord(payee).then(function (res) {
                                if(res.status===400){
                                    Flash.create('danger', res.messages,'payeeFlashMsgDiv');
                                }else {
                                    Flash.create('success',$filter('translate')('save.payee.success'),'FlashMsgDiv');
                                    vm.advice.payee=res.data;
                                    $uibModalInstance.close();
                                }
                            },function (error) {
                                Flash.create('danger', passUtilsService.getValuesByKey(error.data.messages, 'msg').join('<br/>'),'payeeFlashMsgDiv');
                            })
                        }else{
                            addPayeeCtrl.isMendatoryFieldsSelected = true;
                            Flash.create('danger', $filter('translate')('advice.form.mandatoryField'),'payeeFlashMsgDiv');
                        }
                    };
                    addPayeeCtrl.closeModal = function () {
                        $uibModalInstance.close();
                    };

                    $scope.allBanks = [];
                    getAllBanks();
                    function getAllBanks(){
                        addBankService.getAllBanks().then(adminPayeeSuccess).catch(adminPayeeFailure);
                        function adminPayeeSuccess(success){
                            angular.forEach(success,function(data){
                                $scope.allBanks.push({key:data.bankName,value:data._id});
                            });
                        }
                        function adminPayeeFailure(failure){
                        }
                    }
                }
            });
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
                                $uibModalInstance.close();
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

        /**
         *
         * @param searchTerm
         */
        function getAllVirtualLedgers(searchTerm,event) {
            if($rootScope.keyCode.indexOf(event.keyCode) === -1) {
                virtualLedgerService.getVirtualLedgersByName({name:searchTerm,type:"ledger"}).then(successCallback).catch(errorCallback);
            }
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
        function getProjectFullName(item){
            vm.hovered=passUtilsService.getProjectFullName(item);
        }
        function hideProjectName(){
            vm.hovered=""
        }
        function getNewLedger(ledger){
            virtualLedgerService.getLedgerByName({name:ledger.name,discriminator :ledgerType.LEDGER}).then(function(response){
                if(response.status=200){
                    vm.advice.ledger=response.data
                }
            },function(error){
                console.log(error)
            })
        }

    }

}());
