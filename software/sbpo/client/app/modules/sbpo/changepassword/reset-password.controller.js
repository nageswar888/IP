/**
 * Created by Ashish Lamse on 22/9/16.
 */

(function(){
    angular.module('sbpo.resetpassword')
        .controller('resetPasswordController',resetPasswordController);

    resetPasswordController.$inject=['resetPasswordService','$rootScope','$state','$location','Flash','$timeout','$filter'];

    function resetPasswordController(resetPasswordService,$rootScope,$state,$location,Flash,$timeout,$filter){
        var vm=this;
        vm.IsMatch=false;
        vm.resetPassword=resetPassword;

        var username=$location.search().username;
        var passwordtoken=$location.search().passwordtoken;

        vm.currentUsername=username;

        function resetPassword(){
            var data={username:username,passwordtoken:passwordtoken,password:vm.password};

            if (vm.password != vm.resetP) {
                vm.IsMatch=true;
                return false;
            }
            else {
                vm.IsMatch=false;
                resetPasswordService.changePassword(data).then(function(res){
                    if(res.status===200){
                        Flash.create('success',  $filter('translate')('user.password.change.success'),'passwordFlashMsgDiv');

                        $timeout( function(){  $state.go('login') }, 3000);

                    }
                    else {
                        if(res.messages === $filter('translate')('password.error.length.msg'))
                            Flash.create('danger',$filter('translate')('password.error.length.msg'), 'passwordFlashMsgDiv');
                        else
                            Flash.create('danger', $filter('translate')('user.password.change.error'),'passwordFlashMsgDiv');
                    }
                });
            }


        }

    }
})();