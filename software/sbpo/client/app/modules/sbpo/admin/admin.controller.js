/**
 * Created by Ashish Lamse on 3/11/16.
 */

(function(){
    angular.module('admin')
        .controller('adminController',adminController);
        adminController.$inject=['$cookies', '$scope', '$state', '$rootScope', '$timeout', 'passUtilsService','AclService'];

        function adminController($cookies, $scope, $state, $rootScope, $timeout, passUtilsService){
            var ahc=this;
            ahc.btn={};
            ahc.currentUser= $rootScope.getCurrentLoggedInUser();
        }

})();
