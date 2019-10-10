/*
 Created by Ashish Lamse on 2/1/17.
 */

(function(){
  angular.module('sbpo')
      .component('headerComponent', {
          controller:HeaderController,
          controllerAs:'hc',
          template: require('../../partials/header.html')
      });

    HeaderController.$inject=['$rootScope', 'passUtilsService','$cookies'];
    function HeaderController($rootScope, passUtilsService, $cookies ) {
        /*var vm=this;

        if($rootScope.isAuthenticated()){
            $rootScope.$broadcast('updateAdviceCount');
        }
        vm.getRole=getRole;
        vm.canViewCreateAdvice=canViewCreateAdvice;
        vm.canViewDraftAdvice=canViewDraftAdvice;
        vm.canViewInprogressAdvice=canViewInprogressAdvice;
        vm.canViewLegacyAdvice=canViewLegacyAdvice;
        vm.getAdviceCount=getAdviceCount;
        //To get the current logged in user on refresh


        function getRole(){
            return $rootScope.getRole();
        }
        function canViewCreateAdvice() {
            return passUtilsService.hasAnyRole($rootScope.getMultiRoles(),['ROLE_INITIATOR']);
        }
        function canViewLegacyAdvice() {
            return passUtilsService.hasAnyRole($rootScope.getMultiRoles(),['LEGACY_DATA_OPERATOR']);
        }
        function canViewDraftAdvice() {
            return (passUtilsService.hasAnyRole($rootScope.getMultiRoles(),['ROLE_INITIATOR','ROLE_LEVEL3APPROVER','ROLE_LEVEL2APPROVER','ROLE_DISBURSER']));
        }
        function canViewInprogressAdvice() {
            return !(passUtilsService.hasAnyRole($rootScope.getMultiRoles(),['LEGACY_DATA_OPERATOR']));
        }
        function getAdviceCount(){
            $rootScope.$broadcast('updateAdviceCount');
        }*/

    }
})();
