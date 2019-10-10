(function(){
    angular
        .module("admin")
        .controller("ProfileController", ProfileController);
    ProfileController.$inject =['$rootScope', '$cookies', 'addUserService', 'Flash', '$state', '$filter', '$uibModal', 'Regexes', 'passUtilsService', 'validation','changePasswordService'];

    function ProfileController($rootScope, $cookies, addUserService, Flash, $state, $filter, $uibModal, Regexes, passUtilsService, validation,changePasswordService){
        var vm = this;
        vm.currentUser = $rootScope.getCurrentLoggedInUser();
        vm.getUserById=getUserById;
        vm.getUserById();
        vm.editUser=editUser;
        vm.forgotPasscode=forgotPasscode;

        vm.nameLength = validation.user.firstName.maxLength;
        vm.deleteUserSignature=deleteUserSignature;
        //functon for getting details for current user
        $rootScope.$on('UserUpdated', function () {
            getUserById()
        });

        /**
         * This method is use for send for reset passcode of user.
         */
        function forgotPasscode(){
            $uibModal.open({
                template: require('../../../partials/forgotPasscode.html'),

                controller:function UIModalController($scope,$uibModalInstance,Flash){
                    var vm=this;
                    vm.resetPasscode=function(){
                        vm.form.forgotPasscodeFormSubmmmited=true;
                        if(vm.form.$valid){
                            if(vm.passcode === vm.confirmPasscode){
                                changePasswordService.resetPasscode({password:vm.password,passcode:vm.passcode})
                                    .then(resetPasscodeSuccess).catch(resetPasscodeFailure);
                                function resetPasscodeSuccess(successResponse){
                                    if(successResponse.status=== 404){
                                        if(successResponse.messages === $filter('translate')('password.not.match')){
                                            Flash.create('danger',$filter('translate')('password.not.match'), 'errorFlashMsgDiv');
                                        }
                                        else {
                                            Flash.create('danger',$filter('translate')('password.err'), 'errorFlashMsgDiv');
                                        }
                                    }
                                    else if(successResponse.status=== 400 && successResponse.messages === $filter('translate')('passcode.error.length.msg')){
                                        Flash.create('danger',$filter('translate')('passcode.error.length.msg'), 'errorFlashMsgDiv');
                                    }
                                    else {
                                        Flash.create('success',$filter('translate')('password.update.success'), 'userFlashMsgDiv');
                                        $uibModalInstance.close();
                                    }
                                }
                                function resetPasscodeFailure(errorResponse){
                                    Flash.create('danger',$filter('translate')('password.err'), 'errorFlashMsgDiv');
                                }
                            }
                            else {
                                Flash.create('danger',$filter('translate')('passcode.match.error'), 'errorFlashMsgDiv');
                            }
                        }
                    };
                    vm.closePopup=function(){
                        $uibModalInstance.close();
                    }
                },controllerAs:'vm'
            });
            /*console.log("comming here ___123");*/
        }

        function getUserById(){
            if(vm.currentUser) {
                addUserService.getUserByID(vm.currentUser._id).then(function(response){
                        vm.user=response.data;
                        vm.user.mobileno=response.data.phoneNumber;
                        if(!vm.user.enabled){
                            Flash.create('success', $filter('translate')('user.password.passcode.change'),'userFlashMsgDiv');
                        }
                    },function(error){
                        console.log('error')
                    }
                );
            }
        }
        //function for edit user Details
        function editUser(){
            var phoneNumberRegex = Regexes.PHONE_NO_PATTERN;
            var imageFormat = Regexes.IMAGE_EXTENSION_FORMAT;
            afterNameValidationSuccess();
            /*if(vm.user.firstName.match(namePattern) && vm.user.lastName.match(namePattern)){
             if(!vm.user.middleName){
             afterNameValidationSuccess();
             }else{
             if(vm.user.middleName.match(namePattern)){
             afterNameValidationSuccess();
             }else{
             Flash.create('danger',$filter('translate')('update.user.fail'), 'userFlashMsgDiv');
             getUserById();
             }
             }
             }else{
             Flash.create('danger',$filter('translate')('update.user.fail'), 'userFlashMsgDiv');
             getUserById();
             }*/
            function afterNameValidationSuccess(){
                if(phoneNumberRegex.test(vm.user.mobileno)){
                    vm.user['oldPhoneNumber'] = vm.user.phoneNumber;
                    if(vm.user.signature && vm.user.signature.filename){
                        if(!imageFormat.exec(vm.user.signature.filename) && vm.user.signature.filename !== "")
                        {
                            console.log("vm.user.signature.filename");
                            console.log(vm.user.signature.filename);
                            Flash.create('danger',$filter('translate')('signature.format.image.error'), 'userFlashMsgDiv');
                            getUserById();
                        }else{
                            addUserService.editUser(vm.user).then(editUserSuccess).catch(editUserFailure);
                        }
                    }else{
                        addUserService.editUser(vm.user).then(editUserSuccess).catch(editUserFailure);
                    }
                }else{
                    Flash.create('danger',$filter('translate')('Invalid.mob'), 'userFlashMsgDiv');
                    getUserById();
                }
            }
            function editUserSuccess(response){
                Flash.create('success',$filter('translate')('update.user.success'), 'userFlashMsgDiv');
                getUserById();
            }
            function editUserFailure(error){
                Flash.create('danger', passUtilsService.getValuesByKey(error.data.messages, 'msg').join('<br/>'),'userFlashMsgDiv');
                getUserById();
                console.log('error')
            }
        }
        function deleteUserSignature(query){
            $uibModal.open({
                template: require('../../../partials/deleteCustomField.html'),
                controller:function UIModalController($scope,$uibModalInstance,Flash){
                    $scope.deleteHeading=$filter('translate')('confirmation.label');
                    $scope.deleteConformation=$filter('translate')('conform.delete.signature');
                    $scope.deleteCustomField=function(){
                        vm.user.signature=null;
                        addUserService.editUser(vm.user).then(deleteSignatureSuccess).catch(deleteSignatureFailure);
                        function deleteSignatureSuccess(response){
                            Flash.create('success',$filter('translate')('delete.signature.success'), 'userFlashMsgDiv');
                            getUserById();
                        }
                        function deleteSignatureFailure(error){
                            console.log('error')
                        }
                        $uibModalInstance.close();
                    };
                    $scope.cancle=function(){
                        $uibModalInstance.close();
                    }
                }
            });


        }



    }
})();
