'use strict';
(function(){
    angular
        .module('sbpo.login')
        .controller('LoginController', LoginController);

    LoginController.$inject = [ '$state', '$rootScope', '$cookies', 'loginService', 'AclService',
        'searchAdviceService', 'Flash', 'passUtilsService','$filter'];

    function LoginController($state, $rootScope, $cookies, loginService, AclService, searchAdviceService,
                             Flash, passUtilsService ,$filter) {
        var vm = this;
        vm.loginModal = {};
        vm.form = {};
        vm.signin = login;
        vm.forgotPwd = forgotPwd;
        vm.inValidCredentials = false;
        vm.inActiveUser = false;
        vm.checkUserNameExist = checkUserNameExist;
        vm.errors = [];
        function checkUserNameExist(){
            if(!vm.loginModal.username){
                vm.inValidCredentials = false;
            }
        }
        function getACLRoles(userRoles,user){
            loginService.getPrivileges(userRoles).then(function(successRes){
                if(successRes.status===200){
                    $rootScope.aclData=successRes.data;
                    localStorage.setItem("aclDataContant",JSON.stringify($rootScope.aclData));
                    $cookies.putObject($rootScope.STARTUP_CONFIG.currUserCookieName, user);
                    $rootScope.$broadcast('setAclPrivileges',$rootScope.aclData);
                    $rootScope.draftCount=0;
                    vm.submitCount=0;
                    $rootScope.level2count=0;
                    $rootScope.level3count=0;
                    $rootScope.disbApprovedcount=0;
                    $rootScope.disbCount=0;

                    var i=0;
                    var roles = $rootScope.getMultiRoles();
                    if(passUtilsService.hasAnyRole($rootScope.getMultiRoles(),['ROLE_IPASS_MASTERADMIN'])){
                        $state.go('organizations');
                    }else if ( passUtilsService.hasAnyRole(roles,['ROLE_INITIATOR', 'LEGACY_DATA_OPERATOR']) ) {
                        if (!user.enabled) {
                            $state.go('profile');
                        } else {
                            passUtilsService.hasAnyRole(roles,['ROLE_INITIATOR']) ?
                                $state.go('createAdvice') : $state.go('createLegacyAdvice');
                        }
                    }else if(passUtilsService.hasAnyRole(roles,['ROLE_MASTERADMIN'])){
                        user.enabled ? $state.go('admin.userTable') :  $state.go('profile');
                    }else if(passUtilsService.hasAnyRole(roles,['ROLE_VIEWER'])){
                        user.enabled ? $state.go('advice.inprogress', {status: 'Inprogress'}) :  $state.go('profile');
                    }else if(passUtilsService.hasAnyRole(roles,['ROLE_PAYMENT_REQUESTER']) && !passUtilsService.hasAnyRole(roles,['ROLE_LEVEL3APPROVER']) && !passUtilsService.hasAnyRole(roles,['ROLE_LEVEL2APPROVER'])){
                        user.enabled ? $state.go('inprogressPaymentRequests') :  $state.go('profile');
                    }else if(passUtilsService.hasAnyRole(roles,['ROLE_PAYEE'])){
                        user.enabled ? $state.go('paymentHistory') :  $state.go('profile');
                    }else{
                        user.enabled ? $state.go('advice.pending-approval', {status: 'Pending'}) : $state.go('profile');
                    }

                }
                else {
                    console.log("Error",successRes)
                }
            }).catch(function(failureRes){
                console.log("Error",failureRes)
            });
        }

        function login(form) {
            var query = {
                username: vm.loginModal.username,
                password: vm.loginModal.password
            };
            if(vm.form.$valid) {
                loginService.validateUser(query).then(handleLoginSuccess).catch(handleLoginFail);
            }
            function handleLoginSuccess(response) {
                $rootScope.$broadcast('getOrganizationLogo');
                if (response.status === 'FAILED' && response.errors.length > 0) {
                    vm.inValidCredentials = true;
                    angular.element('#login_uname').focus();
                    //Flash.create('danger', response.messages, 'loginmessageDiv');
                }
                else if (response.status === 403) {
                    angular.element('#login_uname').focus();
                    vm.inActiveUser = true;
                    //Flash.create('danger', $filter('translate')('login.organization.inactive'), 'loginmessageDiv');
                }
                else {
                    var userDet = response.data.user;
                    var user = {
                        _id: userDet._id,
                        email: userDet.email,
                        authToken: response.data.token,
                        authenticated: true,
                        roles: userDet.roles,
                        firstName: userDet.firstName,
                        lastName: userDet.lastName,
                        enabled: userDet.enabled,
                        org: userDet.organization
                    };
                    getACLRoles(userDet.roles,user);
                }
            }
            function handleLoginFail(error) {
                console.log(error);
                vm.errors = error.data;
            }
        }
        function forgotPwd() {
            $state.go('forgotPassword');
        }
    }
}());
