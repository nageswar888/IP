/**
 * Created by Ashish Lamse on 22/9/16.
 */
(function(){
    angular.module('sbpo.forgotpassword')
        .factory('forgotpasswordService',forgotpasswordService);

    forgotpasswordService.$inject=['api','$q'];
    function forgotpasswordService(api,$q){
        console.log("inside forgot password service");
            var service={
                forgotPassword:sendEmail,
                forgotPasswordMail:forgotPasswordMail

            };
        return service;
        /**
         * function for sending forgot password mail
         * */
        function forgotPasswordMail(data){
            return api.forgotPasswordMail(data).$promise;
        }
        /**
         * function for sending mail
         * */
        function sendEmail(username){
            return  api.forgotPassword(username).$promise;
        }
    }
})();
