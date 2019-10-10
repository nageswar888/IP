/**
 * Created by sb0103 on 8/11/16.
 */
(function(){
    angular.module('admin')
        .controller('addAdminPayeeController',addAdminPayeeController);
    addAdminPayeeController.$inject=['addAdminPayeeService','$scope','NgTableParams','$uibModal','Flash','$state','$filter', 'passUtilsService', 'validation'];

    function addAdminPayeeController(addAdminPayeeService,$scope,NgTableParams,$uibModal,Flash,$state,$filter, passUtilsService, validation){
        var vm=this;
        vm.admin={};
        vm.allBanks=[];
        vm.successShow='hide';
        vm.forms={};
        vm.forms.adminSubmitted = false;
        vm.payeeNameMaxLength =  validation.payee.firstName.maxLength;
        vm.payeeNickNameMaxLength =  validation.payee.nickName.maxLength;
        vm.payeeMobileMinLength = validation.payee.phone.minLength;
        vm.payeeMobileMaxLength = validation.payee.phone.maxLength;
        vm.bankNameMaxLength = validation.payee.bankName.maxLength;
        vm.bankBranchMaxLength = validation.payee.bankBranch.maxLength;
        vm.ifscCodeMaxLength = validation.payee.ifscCode.maxLength;
        vm.accountNumMaxLength = validation.payee.ifscCode.maxLength;
        vm.emailMaxLength = validation.payee.email.maxLength;

        vm.submitAdminPayee=submitAdminPayee;
        vm.editPayee=editPayee;
        vm.deletePayee=deletePayee;
        vm.getFullName = getFullName;
        vm.getTotalPayees = getTotalPayees;
        vm.viewPayee = viewPayee;


        getAllBanks();
        getTotalPayees();
        loadTable();

        function getTotalPayees(){
            addAdminPayeeService.getTotalPayeeCount().then(handleGetTotalPayeeSuccess).catch(handleGetTotalPayeeFailure);
            function handleGetTotalPayeeSuccess(response) {
                vm.totalPayees = response.data[0].count;
            }
            function handleGetTotalPayeeFailure(error){
                console.log("getTotalPayees error :",error);
            }
        }

        function getFullName(user) {
            return passUtilsService.getUserFullName(user);
        }
        function deletePayee(payee) {

            $uibModal.open({
                template: require('../../../../partials/deletePayee.html'),
                controller: function UIModalController($scope, $uibModalInstance,Flash,$timeout) {

                    $scope.deletePayeeDetail = function () {
                        addAdminPayeeService.deletePayee(payee._id).then(deletePayeeSuccess).catch(deletePayeeFailure);

                        function deletePayeeSuccess(response) {
                            if(response.status===404){
                                Flash.create('danger', $filter('translate')('delete.payee.error'), 'errorFlashMsgDiv');
                            }else{
                                Flash.create('success', $filter('translate')('delete.payee.success'), 'payeeFlashMsgDiv');
                                getTotalPayees();
                                $uibModalInstance.close();
                                vm.tableParams.reload();
                            }


                        }

                        function deletePayeeFailure(error) {
                            console.log(error);
                        }
                    };

                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }
                }

            });
        }

        function editPayee(payee){
            $uibModal.open({
                size:'lg',
                template:require('../../../../partials/editPayee.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash,$timeout){
                    $scope.payee = angular.copy(payee);
                    $scope.payeeNameMaxLength =  validation.payee.firstName.maxLength;
                    $scope.payeeNickNameMaxLength =  validation.payee.nickName.maxLength;
                    $scope.payee.oldPhoneNumber = payee.user.phoneNumber;

                    $scope.bankNameMaxLength = validation.payee.bankName.maxLength;
                    $scope.bankBranchMaxLength = validation.payee.bankBranch.maxLength;
                    $scope.ifscCodeMaxLength = validation.payee.ifscCode.maxLength;
                    $scope.accountNumMaxLength = validation.payee.accountNo.maxLength;
                    /*$scope.allBanks=getAllBanks();*/
                    $scope.editPayeeDetail=function(editPayeeForm){
                        editPayeeForm.adminSubmitted = true;
                        if(editPayeeForm.$valid) {
                            addAdminPayeeService.editPayee($scope.payee).then(editPayeeSuccess).catch(editPayeeFailure);
                        }
                        function editPayeeSuccess(response){
                            if(response.status==='ERROR'){
                                Flash.create('danger', response.messages, 'payeeEditFlashMsgDiv');
                            }else{
                                Flash.create('success',$filter('translate')('update.payee.sucess'), 'payeeFlashMsgDiv');
                                $uibModalInstance.close();
                                vm.tableParams.reload();
                            }

                        }
                        function editPayeeFailure(error){
                            Flash.create('danger', passUtilsService.getValuesByKey(error.data.messages, 'msg').join('<br/>'),'payeeEditFlashMsgDiv');
                            vm.tableParams.reload();
                        }

                    };

                    $scope.cancle=function(){
                        $uibModalInstance.close();
                    }


                },
                windowClass: 'app-modal-window'
            });

        }

        function viewPayee(payee) {
            $uibModal.open({
                size:'lg',
                template:require('../../../../partials/payee/viewPayee.html'),
                controller:function UIModalController($scope,$uibModalInstance){
                    $scope.payee = angular.copy(payee);

                    $scope.cancel=function(){
                        $uibModalInstance.close();
                    }


                },
                windowClass: 'app-modal-window'
            });
        }

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
                            name:params.filter()["name"],
                            email:params.filter()["email"],
                            phoneNumber:params.filter()["phoneNumber"],
                            nickName:params.filter()["nickName"],
                            sort: params.sorting()
                        };
                        return  addAdminPayeeService.getAllPayee(query).then(function(response) {
                            vm.noRecordMessage=false;
                            vm.isDataExist = (response.data.length === 0)
                            if(vm.isDataExist && !isFilterApplied){
                                vm.tableParams.page(params.page() -1)
                                vm.noRecordMessage=true;
                            } else {
                                params.total(response.pagination.total);
                                var orderedData = params.sorting() ?
                                    $filter('orderBy')(response.data, params.orderBy()) : response.data;
                                return orderedData;
                            }
                        }, function(error) {
                            console.error('Error occurred while loading data.');
                        });
                    }});
        }


        function submitAdminPayee(){
            vm.forms.adminSubmitted = true;
            if(vm.forms.$valid) {
                /*Added constant role for Payee */
                vm.admin.role = 'ROLE_PAYEE';
                addAdminPayeeService.submitAdminPayee(vm.admin).then(submitAdminPayeeSuccess).catch(submitAdminPayeeFailure);
            }
            function submitAdminPayeeSuccess(response){
                if(response.status==='ERROR'){
                    Flash.create('danger',response.messages,'payeeFlashMsgDiv');
                }else if(response.status===400){
                    Flash.create('danger',response.messages,'payeeFlashMsgDiv');
                }
                else{
                    Flash.create('success',$filter('translate')('save.payee.success'),'payeeFlashMsgDiv');
                    vm.tableParams.reload();
                    $state.go('admin.payeetbl');
                }

            }

            function submitAdminPayeeFailure(failure){
                Flash.create('danger', passUtilsService.getValuesByKey(failure.data.messages, 'msg').join('<br/>'),'payeeFlashMsgDiv');
            }

        }
        function getAllBanks(){
            addAdminPayeeService.getAllBanks().then(adminPayeeSuccess).catch(adminPayeeFailure);

            function adminPayeeSuccess(response){
                angular.forEach(response.data,function(data){
                    vm.allBanks.push({key:data.bankName,value:data._id});
                });
                vm.allBanks;
            }

            function adminPayeeFailure(failure){

            }
        }

    }
})();
