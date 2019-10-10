/**
 * Created by sb0103 on 8/11/16.
 */
(function () {
    angular.module('admin')
        .controller('addbankController',addbankController);
    addbankController.$inject=["addBankService","NgTableParams","$uibModal",'$scope','Flash','$state','$timeout','$rootScope','$filter', 'validation','accountType'];

    function addbankController(addBankService,NgTableParams,$uibModal,$scope,Flash,$state,$timeout,$rootScope,$filter, validation,accountType){
        var vm=this;
        vm.admin={};
        vm.successShow='hide';
        vm.submitBank=submitBank;
        vm.editBank=editBank;
        vm.viewBank=viewBank;
        vm.deleteBank=deleteBank;
        vm.form = {};
        vm.form.bankFormSubmitted = false;
        vm.accountType=$rootScope.accountType;
        vm.admin.openingBalance=0;
        vm.setAccountTypeHiddenValueEmpty=setAccountTypeHiddenValueEmpty;
        vm.admin.asOf = moment(new Date()).format($rootScope.dateFormate);
        vm.accountValidation = validation;
        loadTable();
        getTotalAccounts();
        /*constant for bank related fields
        * */
        vm.bankAccount=accountType.BANK_ACCOUNT;
        vm.creditCard=accountType.CREDIT_CARD;
        vm.debitCard=accountType.DEBIT_CARD;
        vm.cashOnHand=accountType.CASH_ON_HAND;

        vm.bankBalance=validation.account.bankBalance.maxLength;


        function getTotalAccounts(){
            addBankService.getTotalAccountCount().then(handleGetTotalAccountCountSuccess).catch(handleGetTotalAccountCountFailure);
            function handleGetTotalAccountCountSuccess(response) {
                vm.totalAccounts = response.data[0].count;
            }
            function handleGetTotalAccountCountFailure(error){
                console.log("getTotalAccounts error :",error);
            }
        }

        //function for remove input field values on changing of account type
        function setAccountTypeHiddenValueEmpty(){
            if(vm.admin.accountType===vm.bankAccount){
                delete vm.admin.creditCardNumber;
                delete vm.admin.debitCardNumber;
            }
            else if(vm.admin.accountType===vm.cashOnHand || vm.admin.accountType===vm.creditCard || vm.admin.accountType===vm.debitCard){
                delete vm.admin.accountno;
                delete vm.admin.creditCardNumber;
                delete vm.admin.debitCardNumber;
                delete vm.admin.bankname;
                delete vm.admin.branchname;
                delete vm.admin.ifsccode;
                delete vm.admin.address;
            }
        }
        //function for delete bank
        function deleteBank(bank){
            $uibModal.open({
                template: require('../../../../partials/deleteBank.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash){
                    $scope.deleteBankDetail=function(){
                        addBankService.deleteBank(bank._id).then(deleteBankSuccess).catch(deleteBankFailure);

                        function deleteBankSuccess(success){
                            if(success.status==='FAILED'){
                                Flash.create('danger',$filter('translate')('delete.bank.error'), 'errorFlashMsgDiv');
                            }else{
                                Flash.create('success',$filter('translate')('delete.bank.success'), 'bankFlashMsgDiv');
                                vm.tableParams.reload();
                                $uibModalInstance.close();
                                getTotalAccounts();
                            }

                        }

                        function deleteBankFailure(failure){
                            console.log("failure")
                        }


                    };

                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }
                }
            });
        }
        //function for edit  bank details
        function editBank(bank){

            $uibModal.open({
                size:'lg',
                template:require('../../../../partials/editBank.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash,$timeout){
                    $scope.accountType=vm.accountType;
                    $scope.bankAccount=vm.bankAccount;
                    $scope.creditCard=vm.creditCard;
                    $scope.debitCard=vm.debitCard;
                    $scope.cashOnHand=vm.cashOnHand;
                    $scope.admin={
                        accountname:bank.accountName,
                        accountType:bank.accountType,
                        accountno:bank.accountNo,
                        bankname:bank.bankName,
                        branchname:bank.branchName,
                        ifsccode:bank.ifscCode,
                        address:bank.address,
                        openingBalance:bank.openingBalance,
                        creditCardNumber:bank.creditCardNumber,
                        debitCardNumber:bank.debitCardNumber,
                        asOf:bank.asOf?moment(new Date(bank.asOf)).format($rootScope.dateFormate):'',
                        id:bank._id,
                        accountValidation: validation

                    };
                    if($scope.admin.address){
                        $scope.admin.address = $scope.admin.address.split("\n").join(",")
                    }
                    $scope.cancleBankDetail=function(){
                        $uibModalInstance.close();
                    };

                    $scope.editBankDetail=function(editBankForm){
                        editBankForm.bankFormSubmitted = true;
                        if(editBankForm.$valid) {
                            addBankService.editBankDetail($scope.admin).then(editBankDetailSuccess).catch(editBankDetailFailure);
                        }
                        function editBankDetailSuccess(response){
                            if(response.status=='OK') {
                                    Flash.create('success', $filter('translate')('update.bank.success'), 'bankFlashMsgDiv');
                                    vm.tableParams.reload();
                                    $uibModalInstance.close();
                            }
                            else if(response.status===409) {
                                Flash.create('danger',$filter('translate')(response.messages),'bankNameFlashMsgDiv');
                            }
                        }

                        function editBankDetailFailure(failure){

                        }
                    }
                },
                windowClass: 'app-modal-window'
            });
        }


        //function for edit  bank details
        function viewBank(bank){

            $uibModal.open({
                size:'lg',
                template: require('../../../../partials/viewBank.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash,$timeout){
                    $scope.accountType=vm.accountType;
                    $scope.admin={
                        accountname:bank.accountName,
                        accountType:bank.accountType,
                        accountno:bank.accountNo,
                        bankname:bank.bankName,
                        branchname:bank.branchName,
                        ifsccode:bank.ifscCode,
                        address:bank.address,
                        openingBalance:bank.openingBalance,
                        creditCardNumber:bank.creditCardNumber,
                        debitCardNumber:bank.debitCardNumber,
                        asOf:bank.asOf?moment(new Date(bank.asOf)).format($rootScope.dateFormate):'',
                        id:bank._id

                    };
                    $scope.cancelBankDetail=function(){
                        $uibModalInstance.close();
                    };
                },
                windowClass: 'app-modal-window'
            });
        }

        //function for loading bank details
        function loadTable(){
            vm.tableParams = new NgTableParams(
                {
                    page: 1,
                    count: 10
                },{
                    getData: function(params){
                        var isFilterApplied = true;
                        if(angular.equals(params.filter(), {})) { isFilterApplied = false; }
                        var query = {
                            page_size: params.count() === -1 ? 0 : params.count(),
                            page:params.page(),
                            accountName:params.filter()["accountName"],
                            accountType:params.filter()["accountType"],
                            accountNo:params.filter()["accountNo"],
                            bankName:params.filter()["bankName"],
                            branchName:params.filter()["branchName"],
                            ifscCode:params.filter()["ifscCode"],
                            address:params.filter()["address"],
                        };

                        return  addBankService.getAllBanks(query).then(function(response) {
                            vm.noRecordMessage=false;
                            vm.isDataExist = (response.data.length === 0)
                            params.total(response.pagination.total);
                            if ( vm.isDataExist && !isFilterApplied) {
                                vm.noRecordMessage=true;
                                vm.tableParams.page(params.page() -1)
                            } else {
                                return params.sorting() ? $filter('orderBy')(response.data, params.orderBy()) : response.data;
                            }
                        }, function(error) {
                            console.error('Error occured while loading data.');
                        });
                    }});
        }

        //function for shave bank details
        function submitBank(){
            console.log("inside bank controller");
            vm.form.bankFormSubmitted = true;
            if(vm.form.$valid) {
                if(vm.admin.address){
                    vm.admin.address = vm.admin.address.split("\n").join(",")
                }
                addBankService.submitBank(vm.admin).then(successBank).catch(failureBank);
            }
            else {
                console.log(vm.form.bankFormSubmitted);
            }
            function successBank(response){
                if(response.status == 409){
                    Flash.create('danger',$filter('translate')(response.messages),'bankFlashMsgDiv');
                }else{
                    Flash.create('success',$filter('translate')('save.bank.success'),'bankFlashMsgDiv');
                    vm.tableParams.reload();
                    $state.go('admin.banktbl');
                }
            }

            function failureBank(failure){
                console.log(failure);
            }
        }


    }
})();
