/**
 * Created by sb0103 on 10/11/16.
 */
(function(){
    angular.module('admin')
        .controller('addUserController',addUserController);

    addUserController.$inject=['$scope','addUserService','Flash','NgTableParams','$uibModal','$state','$rootScope','$filter','paymentRequestService', 'passUtilsService','paymentAdvice', 'Regexes', 'validation'];

    function addUserController($scope,addUserService,Flash,NgTableParams,$uibModal,$state,$rootScope,$filter,paymentRequestService, passUtilsService, paymentAdvice, Regexes, validation){
        var vm=this;
        vm.isPaymentRequester = false;
        vm.isPaymentRequesterEdit = false;
        vm.submitUser=submitUser;
        vm.admin={};
        vm.allRoles=[];
        vm.successShow='hide';
        vm.form = {};
        vm.form.userFormSubmitted = false;
        vm.deleteUser=deleteUser;
        vm.editUser=editUser;
        vm.getAllProjects = getAllProjects;
        vm.checkImageFormat = checkImageFormat;
        vm.getTotalUsers = getTotalUsers;
        vm.totalUsers = 0;
        vm.isImageFormat = false;
        vm.nameLength = validation.user.firstName.maxLength;
        vm.phoneNoLength = validation.user.phone.length;
        vm.emailMinLength = validation.user.email.minLength;
        function checkImageFormat(){

            var imagePattern = Regexes.IMAGE_EXTENSION_FORMAT;
            if(!imagePattern.exec(vm.admin.signature.filename)){
                vm.isImageFormat = true;
                vm.form.$valid=false;
            }else{
                vm.isImageFormat = false;
            }

        }

        function getTotalUsers() {
            addUserService.getTotalUsersCount().then(handleGetTotalUsersSuccess).catch(handleGetTotalUsersFailure);
            function handleGetTotalUsersSuccess(response) {
                vm.totalUsers = response.data[0].count;
            }
            function handleGetTotalUsersFailure(error){
                console.log("getTotalUsers error :",error);
            }
        }
        getTotalUsers();
        loadTable();
        getAllRoles();

        $scope.$watch('auc.admin.role', function(newValue, oldValue) {
            if((newValue && newValue.indexOf('ROLE_PAYMENT_REQUESTER') !== -1)) {
                vm.isPaymentRequester = true;
            }
            else {
                vm.isPaymentRequester = false;
            }
        });

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

        //function for getiing user details and load in table
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
                            firstName:params.filter()["firstName"],
                            email:params.filter()["email"],
                            phoneNumber:params.filter()["phoneNumber"],
                            isPayeeNotAllowed:true
                        };
                        return  addUserService.getAllUser(query).then(function(response) {
                            vm.noRecordMessage=false;
                            vm.isDataExist = (response.data.length === 0)
                            params.total(response.pagination.total);
                            if( vm.isDataExist && !isFilterApplied){
                                vm.noRecordMessage=true;
                            } else {
                                var orderedData = params.sorting() ?
                                    $filter('orderBy')(response.data, params.orderBy()) : response.data;
                                return orderedData;
                            }
                        }, function(error) {
                            console.error('Error occured while loading data.');
                        });
                    }});
        }
        //function for edit user details
        function editUser(user){
            $uibModal.open({
                size: 'lg',
                templateUrl:'partials/editUser.html',
                controller:function($scope,$uibModalInstance,Flash,$timeout,paymentRequestService,validation){
                    var ec=this;
                    ec.nameLength = validation.user.firstName.maxLength;
                    ec.roles=vm.allRoles;
                    ec.projects=vm.paymentReqprojects;
                    ec.isPaymentRequesterRole = false;
                    ec.user={
                        _id:user._id,
                        firstName:user.firstName,
                        middleName:user.middleName,
                        lastName:user.lastName,
                        email:user.email,
                        mobileno:user.phoneNumber,
                        roles:user.roles,
                        enabled:user.enabled,
                        signature:user.signature ? user.signature._id : undefined,
                        oldPhoneNumber:user.phoneNumber,
                        oldProject: user.project
                    };
                    ec.close = close;
                    function close(){
                        $uibModalInstance.dismiss();
                    }

                    getAllProjectsForPaymentRequester();

                    function getAllProjectsForPaymentRequester(){
                        paymentRequestService.getAssignedProjectsByUserId({user:user._id})
                            .then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
                        function handleReadProjectsSuccess(response) {
                            ec.user.project=response.data;
                        }
                        function handleReadProjectsFailure(error){
                            console.log(error);
                        }
                    }
                    ec.getAllProjects = function(searchTerm) {
                        paymentAdvice.getProjectsByName({projectName:searchTerm}).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
                        function handleReadProjectsSuccess(response) {
                            ec.projects=response.data;
                        }
                        function handleReadProjectsFailure(error){
                            console.log(error);
                        }
                    }
                    $scope.$watch('ec.user.roles', function(newValue, oldValue) {
                        if((oldValue && oldValue.indexOf('ROLE_PAYMENT_REQUESTER') !== -1)) {
                            ec.isPaymentRequesterRole = true;
                        }
                        else {
                            ec.isPaymentRequesterRole = false;
                        }
                        if((newValue && newValue.indexOf('ROLE_PAYMENT_REQUESTER') !== -1)) {
                            ec.isPaymentRequesterRole = true;
                        }
                        else {
                            ec.isPaymentRequesterRole = false;
                        }
                    });
                    ec.removed = function(){
                        var currentLogeInUser = $rootScope.getCurrentLoggedInUser();
                        if(user.email === currentLogeInUser.email && user.roles.indexOf("ROLE_MASTERADMIN") !== -1 && ec.user.roles.indexOf("ROLE_MASTERADMIN") == -1) {
                            ec.user.roles.push("ROLE_MASTERADMIN");
                            Flash.create('danger', $filter('translate')('remove.user.admin.role.error'),'userFlashMsgDiv');
                        }
                    };
                    ec.editUser=function(editUserForm){
                        vm.forceDelete=true;
                        if(editUserForm.$valid) {
                            var query={
                                user : ec.user,
                                forceFlag : vm.forceDelete
                            }
                            addUserService.editUser(query).then(editUserSuccess).catch(editUserFailure);
                        }
                        else{
                            Flash.create('danger', $filter('translate')('user.form.invalid'),'userFlashMsgDiv');
                        }
                        function editUserSuccess(response){
                            var vm1=this;
                            if (response.status === 401) {
                                vm.forceDelete = false;
                                var query={
                                    user : ec.user,
                                    forceFlag : vm.forceDelete
                                }
                                $uibModal.open({
                                    templateUrl: 'partials/changeProjectConfirmation.html',
                                    controller: function ($scope,$uibModalInstance,Flash,$timeout,addUserService) {
                                        var parent = ec;
                                        var pc=this;
                                        pc.editProjectAfterConfirmation = editProjectAfterConfirmation;
                                        function editProjectAfterConfirmation(){
                                            if(pc.form.$valid){
                                                ec.forceDelete = true;
                                                addUserService.editUser(query).then(handleEditUserSuccess).catch(handleEditUserFail);
                                            }
                                            else {
                                                Flash.create('danger', $filter('translate')('user.form.invalid'), 'userFlashMsgDiv');
                                            }
                                            function handleEditUserSuccess(response) {
                                                if (response.status === 200) {
                                                    Flash.create('success', $filter('translate')('update.user.success'), 'userFlashMsgDiv');
                                                    $uibModalInstance.close();
                                                    parent.close();
                                                    vm.tableParams.reload();

                                                }
                                                else if (response.status === 400) {
                                                    Flash.create('danger', passUtilsService.getValuesByKey(error.data.messages, 'msg').join('<br/>'), 'userFlashMsgDiv');
                                                }
                                                else {
                                                    $uibModalInstance.dismiss();
                                                    $state.reload();
                                                }
                                            }

                                            function handleEditUserFail(error) {
                                                console.log(error);
                                            }

                                        }
                                        pc.closePopup = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        }
                                    },
                                    controllerAs:'epe'
                                });
                            } else if (response.status === 400) {
                                Flash.create('danger', $filter('translate')('response.message'), 'userFlashMsgDiv');
                            } else if (response.status == 200) {
                                Flash.create('success', $filter('translate')('update.user.success'), 'userFlashMsgDiv');
                                $uibModalInstance.close();
                                vm.tableParams.reload();
                            }
                        }

                        function editUserFailure(error) {
                            Flash.create('danger', passUtilsService.getValuesByKey(error.data.messages, 'msg').join('<br/>'),'userFlashMsgDiv');
                            console.log('error')
                        }

                    };

                    ec.closeEditModal=function(){
                        $uibModalInstance.close();
                        $state.go('admin.userTable');
                    }
                },
                controllerAs:'ec',
                windowClass: 'app-modal-window'
            });

        }
        //function for delete user
        function deleteUser(user){
            var submitLabel =  user.enabled ? $filter('translate')('user.button.deactivate') :
                $filter('translate')('user.button.activate');
            passUtilsService.verifyPasscodeModal({}, function() {
                addUserService.deleteUser(user._id).then(deleteUserSuccess).catch(deleteUserFailure);
                function deleteUserSuccess(response){
                    var updatedUser = response.data;
                    if(updatedUser.enabled) {
                        Flash.create('success',$filter('translate')('enable.user.success'), 'userFlashMsgDiv');
                    }else {
                        Flash.create('success',$filter('translate')('disable.user.success'), 'userFlashMsgDiv');
                    }
                    vm.tableParams.reload();
                }
                function deleteUserFailure(error){
                    console.log(error);
                    Flash.create('danger',$filter('translate')('deactivate.user.admin.role.error'), 'userFlashMsgDiv');
                }
            }, false,user,submitLabel);
        }
        //function for getting all roles
        function getAllRoles(){
            var query = {except:['ROLE_PAYEE']};
            addUserService.getAllRoles(query).then(getAllRolesSuccess).catch(getAllRolesFailure);

            function getAllRolesSuccess(response){
                angular.forEach(response.data,function(data){
                    var role = $filter('RoleNames')(data.name);
                    vm.allRoles.push(role);
                });

            }

            function getAllRolesFailure(failure){
                console.log("response failure")
            }
        }
        //function for submit user details for storing in db
        function submitUser(){
            if(!vm.hasOwnProperty('isImageFormat')){
                checkImageFormat();
            }
            vm.form.userFormSubmitted=true;
            if(vm.form.$valid && !vm.isImageFormat) {
                addUserService.submitUser(vm.admin).then(function(response){
                    if(response.status==='FAILED' && response.messages==='Email already exists'){
                        Flash.create('danger', 'Email already exists.','userFlashMsgDiv');
                    }else if(response.status==='FAILED' && response.messages==='Mobile number already exists') {
                        Flash.create('danger', 'Mobile number already exists.','userFlashMsgDiv');
                    }else{
                        Flash.create('success', 'User created successfully.','userFlashMsgDiv');
                        $state.go('admin.userTable');
                    }
                }, function(error){
                    Flash.create('danger', passUtilsService.getValuesByKey(error.data.messages, 'msg').join('<br/>'),'userFlashMsgDiv');
                });
            }
        }
    }
})();
