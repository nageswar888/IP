/**
 * Created by semanticbits on 14/12/16.
 */
(function(){
    angular
        .module('sbpo.login')
        .factory('changePasswordService', changePasswordService);
    changePasswordService.$inject = ['$q','api'];
    function changePasswordService($q,api){
        var service = {
            changePassword:changePassword,
            resetPasscode:resetPasscode
        };
        return service;
        function changePassword(query){
            return api.changePassword(query).$promise;
        }

        function resetPasscode(query){
            return api.resetPasscode(query).$promise;
        }

    }
}());
