'use strict';
(function () {
    angular
        .module('sbpo.login')
        .factory('loginService', loginService);
    loginService.$inject = ['$rootScope','api','$q','$cookies'];

    function loginService($rootScope,api,$q,$cookies) {
        var service = {
            validateUser: validateUser,
            getLogedUser: getLogedUser,
            logout: logout,
            getPrivileges:getPrivileges
        };
        return service;
        function getPrivileges(query){
            return api.getPrivileges(query).$promise;
        }
        /*service is for remove current login user token*/
        function logout(){
            return api.logout().$promise;
        }
        //update user details
        function validateUser ( userDetails ) {
            return api.authenticate(userDetails).$promise;
        }

        function getLogedUser() {
            return $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);
        }
    }
}());
