/*
 Created by Ashish Lamse on 2/1/17.
 */

(function(){
    angular.module('sbpo')
        .component('subMenu', {
            controller:subMenuController,
            controllerAs:'sc',
            template: require('../partials/subHeaderMenuBar.html'),
            transclude:true
        });

    subMenuController.$inject=['$rootScope', 'passUtilsService','$cookies', 'AclService'];
    function subMenuController($rootScope, passUtilsService, $cookies, AclService ) {
        var vm=this;

        if($rootScope.isAuthenticated()){
            $rootScope.$broadcast('updateAdviceCount');
            $rootScope.$broadcast('updatePaymentReqCount')
        }
        vm.getRole=getRole;
        vm.canViewCreateAdvice=canViewCreateAdvice;
        vm.canViewDraftAdvice=canViewDraftAdvice;
        vm.canViewInprogressAdvice=canViewInprogressAdvice;
        vm.canViewLegacyAdvice=canViewLegacyAdvice;
        vm.canViewRejectedAdvice=canViewRejectedAdvice;
        vm.getAdviceCount=getAdviceCount;
        vm.canViewPaymentRequests = canViewPaymentRequests;
        vm.canViewPaymentRequestTabs = canViewPaymentRequestTabs;

        vm.isHomeTab = isHomeTab;
        vm.isUserTab = isUserTab;
        vm.isPayeeTab = isPayeeTab;
        vm.isProjectTab = isProjectTab;
        vm.isAccountTab = isAccountTab;
        vm.isSettingsTab = isSettingsTab;
        vm.canViewCreatePaymentRequest = canViewCreatePaymentRequest;
        vm.canViewSearch = canViewSearch;
        vm.canViewPaymentHistory = canViewPaymentHistory;
        vm.getPaymentRequestCount = getPaymentRequestcountCount;
        vm.isDisburserRole = isDisburserRole;
        //To get the current logged in user on refresh


        function getPaymentRequestcountCount(){
            $rootScope.$broadcast('updatePaymentReqCount');
        }
        function getRole(){
            return $rootScope.getRole();
        }
        function canViewCreateAdvice() {
           return AclService.hasRole('ROLE_INITIATOR');
        }
        function canViewLegacyAdvice() {
            return AclService.hasRole('LEGACY_DATA_OPERATOR');
        }
        function canViewDraftAdvice() {
            return AclService.hasAnyRole(['ROLE_INITIATOR','ROLE_LEVEL3APPROVER','ROLE_LEVEL2APPROVER','ROLE_DISBURSER']);
        }
        function canViewInprogressAdvice() {
            return AclService.hasAnyRole(['ROLE_INITIATOR','ROLE_LEVEL3APPROVER','ROLE_LEVEL2APPROVER','ROLE_DISBURSER','ROLE_MASTERADMIN','ROLE_VIEWER']);
        }
        function canViewRejectedAdvice() {
            return AclService.hasAnyRole(['ROLE_INITIATOR','ROLE_LEVEL3APPROVER','ROLE_LEVEL2APPROVER','ROLE_DISBURSER','ROLE_MASTERADMIN','ROLE_VIEWER']);
        }
        function canViewPaymentRequests() {
            return AclService.hasRole('ROLE_INITIATOR');
        }
        function canViewSearch() {
            return AclService.hasAnyRole(['ROLE_INITIATOR','ROLE_LEVEL3APPROVER','ROLE_LEVEL2APPROVER','ROLE_DISBURSER','ROLE_MASTERADMIN','ROLE_VIEWER','LEGACY_DATA_OPERATOR']);
        }
        function canViewCreatePaymentRequest() {
            return AclService.hasAnyRole('ROLE_PAYMENT_REQUESTER');
        }

        function canViewPaymentRequestTabs(){
            return AclService.hasAnyRole(['ROLE_PAYMENT_REQUESTER','ROLE_INITIATOR']);
        }


        function canViewPaymentHistory(){
            return AclService.hasAnyRole('ROLE_PAYEE');
        }
        function getAdviceCount(){
            $rootScope.$broadcast('updateAdviceCount');
        }
        function isDisburserRole() {
            return (AclService.hasAnyRole(['ROLE_DISBURSER']));
        }
        function isHomeTab() {
            return $rootScope.canShowHeader();
        }

        function isUserTab() {
            return $rootScope.$state.current.name === 'admin.user' || $rootScope.$state.current.name === 'admin.userTable';
        }

        function isPayeeTab() {
            return $rootScope.$state.current.name === 'admin.payeetbl' || $rootScope.$state.current.name === 'admin.payee';
        }

        function isProjectTab() {
            return $rootScope.$state.current.name === 'admin.projecttbl' || $rootScope.$state.current.name === 'admin.project';
        }

        function isAccountTab() {
            return $rootScope.$state.current.name === 'admin.banktbl' || $rootScope.$state.current.name === 'admin.bank';
        }

        function isSettingsTab() {
            return $rootScope.$state.current.name === 'admin.notification' || $rootScope.$state.current.name === 'admin.customFields';
        }
    }
})();

