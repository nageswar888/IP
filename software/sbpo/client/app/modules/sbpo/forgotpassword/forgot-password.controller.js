/**
 * Created by Ashish Lamse on 21/9/16.
 */
(function(){
    angular.module('sbpo.forgotpassword')
        .controller('forgotPasswordController',forgotPasswordController);

    forgotPasswordController.$inject=['forgotpasswordService','Flash','$filter'];

    function forgotPasswordController(forgotpasswordService,Flash,$filter){
        var vm=this;
        vm.form = {};
        vm.inValidCredentials = false;
        vm.forgotPassword=forgotPassword;

        function forgotPassword(){
            if(vm.form.$valid) {
                forgotpasswordService.forgotPassword({q:vm.user}).then(function(res){
                    if(res.status===200){
                        Flash.create('success', $filter('translate')('reset.password.checkMail'),'passwordFlashMsgDiv');
                    }else if( (res.status===400 || res.status===403 || res.status===404  || res.status===500) && res.errors.length > 0){
                        Flash.create('danger', res.messages,'passwordFlashMsgDiv');
                        //Flash.create('danger', res.messages, 'passwordFlashMsgDiv');
                    }
                    else {
                        vm.inValidCredentials = true;
                    }
                });
            }
        }
    }
})();