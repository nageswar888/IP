'use strict';
(function(){
    angular
        .module('sbpo.organization')
        .controller('organizationController', organizationController);

    organizationController.$inject = ['organizationService', 'NgTableParams', '$filter', 'Flash','$uibModal'];

    function organizationController( organizationService, NgTableParams, $filter, Flash ,$uibModal) {
        var vm = this;
        vm.updateOrg = updateOrganization;
        loadOrganizations();

        function updateOrganization(org) {
            $uibModal.open({
                template: require('../../../partials/organizations/organizationActiveDeactiveConfirm.html'),
                controller:function($scope,$uibModalInstance,Flash){
                    $scope.label = org.enabled ? 'confirm.deactivation.msg' : 'confirm.activation.msg';
                    $scope.ok=function(){
                        organizationService.updateOrganization({id:org._id}).then(function(response){
                            Flash.create('success', $filter('translate')('org.updated.success'),'orgFlashMsgDiv');
                            vm.tableParams.reload();
                            $uibModalInstance.close();
                        },function (error) {
                            console.error('Error occured while loading data.');
                        });
                    };
                    $scope.cancleConfirmationForm=function(){
                        $uibModalInstance.close();
                    }
                }
            });
        }

        //load Organizations
        function loadOrganizations(){
            vm.tableParams = new NgTableParams(
                {
                    page: 1,
                    count: 10
                },{
                    getData: function(params){
                        var query = {
                            page_size: params.count() === -1 ? 0 : params.count(),
                            page:params.page(),
                            name:params.filter()["name"],
                            subDomain:params.filter()["subDomain"]
                        };
                        return organizationService.getOrganizations(query).then(function(response) {
                            params.total(response.pagination.total);
                            if(response.data.length !== 0){
                                var orderedData = params.sorting() ?
                                    $filter('orderBy')(response.data, params.orderBy()) : response.data;
                                return orderedData;
                            }
                        }, function(error) {
                            console.error('Error occured while loading data.');
                        });
                    }});
        }
    }
}());
