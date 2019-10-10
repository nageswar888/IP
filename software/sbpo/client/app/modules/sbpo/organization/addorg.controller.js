'use strict';
(function(){
    angular
        .module('sbpo.organization')
        .controller('addOrgController', addOrgController);

    addOrgController.$inject = ['organizationService', 'Flash', '$filter', '$state', 'Regexes'];

    function addOrgController( organizationService , Flash, $filter, $state, Regexes) {
        var vm = this;
        vm.orgForm = {};
        vm.org = {
            user: {}
        };
        vm.saveOrg = saveOrganization;
        vm.subDomainPattern=Regexes.NAME_PATTERN;
        function saveOrganization() {
            vm.orgForm.orgFormSubmitted=true;
            if(vm.orgForm.$valid) {
                organizationService.saveOrganization(vm.org).then(function(response){
                    if( response.status === 'FAILED' ) {
                        Flash.create('danger', response.messages,'orgFlashMsgDiv');
                    } else {
                        Flash.create('success', $filter('translate')('org.saved.success'),'orgFlashMsgDiv');
                        $state.go('organizations');
                    }
                }).catch(function(errResponse){
                    Flash.create('danger', $filter('translate')('some.thing.went.wrong'),'orgFlashMsgDiv');
                });
            }else{
                Flash.create('danger', $filter('translate')('enter.valid.fields'),'orgFlashMsgDiv');
            }
        }
    }
}());
