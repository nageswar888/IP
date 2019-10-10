/**
 * Created by Ashish Lamse on 22/9/16.
 */

(function(){
    angular.module('sbpo.resetpassword')
        .factory('resetPasswordService',resetPasswordService);
    resetPasswordService.$inject=['api','$q'];

    function resetPasswordService(api,$q){

        var deffered=$q.defer();

        var service={
            changePassword:changePassword
        };
        return service;
        function changePassword(query){
           return api.resetPassword(query).$promise;
        }
    }
})();
