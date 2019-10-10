/**
 * Created by semanticbits on 14/12/16.
 */
(function(){
    angular
        .module('sbpo.login')
        .controller('changePasswordController', changePasswordController);

    changePasswordController.$inject = ['changePasswordService','$cookies','Flash','addUserService','$filter', '$rootScope'];
    function changePasswordController(changePasswordService,$cookies,Flash,addUserService,$filter, $rootScope){
        var vm=this;

        vm.changePassword=changePassword;
        vm.showPasswordDiv=showPasswordDiv;
        vm.hidePasswordDiv=hidePasswordDiv;
        vm.showPasscodeDiv=showPasscodeDiv;
        vm.hidePasscodeDiv=hidePasscodeDiv;
        vm.changePasscode=changePasscode;
        vm.currentUser = $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);

        function showPasscodeDiv(){
            vm.showPasscode=true;
        }
        function hidePasscodeDiv(){
            vm.showPasscode=false;
            vm.existingPasscode='';
            vm.passcode1='';
            vm.passcode2='';
        }
        function showPasswordDiv(){
            vm.show=true;
        }
        function hidePasswordDiv(){
            vm.show=false;
            vm.existingPassword='';
            vm.password1='';
            vm.password2='';
        }
        function changePassword(){
            vm.passwordForm.passwordFormSubmitted=true;
            if(vm.passwordForm.$valid){
                var query={
                    id:vm.currentUser._id,
                    existingPassword:vm.existingPassword,
                    password1:vm.password1,
                    password2:vm.password2
                };
                changePasswordService.changePassword(query).then(changePasswordSuccess).catch(changePasswordFailure);
                function changePasswordSuccess(response) {

                    if(response.status===404 && response.messages==='Invalid credentials'){
                        Flash.create('danger',  $filter('translate')('user.existingPassword.wrong'), 'userFlashMsgDiv');
                    }
                    else if(response.status===404 && response.messages==='Passwords does not match'){
                        Flash.create('danger', $filter('translate')('user.conform.password'), 'userFlashMsgDiv');
                    }
                    else if(response.status===404 && response.messages==='Current password and new password should not be same'){
                        Flash.create('danger', $filter('translate')('user.current.new.password.error'), 'userFlashMsgDiv');
                    }
                    else if(response.status===400 && response.messages==='There should be minimum 8 characters for password.'){
                        Flash.create('danger', $filter('translate')('password.error.length.msg'), 'userFlashMsgDiv');
                    }
                    else{
                        Flash.create('success',$filter('translate')('user.password.change.success'), 'userFlashMsgDiv');
                        vm.hidePasswordDiv();
                        $rootScope.$broadcast('UserUpdated');
                    }

                }
                function changePasswordFailure(error){
                    console.log(error);
                }
            }
            else {

            }

        }
        //function for changing passcode
        function changePasscode(){
            vm.form.passcodeFormSubmitted=true;
            if(vm.form.$valid){
                var query={
                    id:vm.currentUser._id,
                    existingPasscode:vm.existingPasscode,
                    passcode1:vm.passcode1,
                    passcode2:vm.passcode2
                };
                addUserService.changePasscode(query).then(changePasscodeSuccess).catch(changePasscodeFailure);

                function changePasscodeSuccess(response){
                    if(response.status===404 && response.messages==='Invalid passcode'){
                        Flash.create('danger', $filter('translate')('user.existingPasscode.wrong'), 'userFlashMsgDiv');
                    }
                    else if(response.status===404 && response.messages==='Passcodes does not match'){
                        Flash.create('danger', $filter('translate')('user.conform.passcode'), 'userFlashMsgDiv');
                    }else if(response.status===400 && response.messages==='There should be minimum 8 characters for passcode.'){
                        Flash.create('danger', $filter('translate')('passcode.error.length.msg'), 'userFlashMsgDiv');
                    }
                    else if(response.status===404 && response.messages==='Current passcode and new passcode should not be same'){
                        Flash.create('danger', $filter('translate')('user.current.new.passcode.error'), 'userFlashMsgDiv');
                    }
                    else{
                        Flash.create('success',$filter('translate')('user.passcode.change.success'), 'userFlashMsgDiv');
                        vm.hidePasscodeDiv();
                        $rootScope.$broadcast('UserUpdated');
                    }
                }

                function changePasscodeFailure(failure){
                    console.log("response failure")
                }
            }
          else {

            }
        }
    }
}());
