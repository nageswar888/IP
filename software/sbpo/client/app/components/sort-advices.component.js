/**
 * Created by sb0103 on 16/1/17.
 */
'use strict';
(function(){
    angular.module('sbpo').component('sortAdvices',{
        bindings: {
            getAdvicesByStatus: '&',
            downloadAllAdvicesByStatus: '&',
            canViewDelete: '&',
            currentStatus:'=',
            deleteSeletedAdvices:'=',
            groupByStatus:'='
        },
        template: require('../partials/sortAdvice.html'),
        controller:sortAdvicesController,
        controllerAs:'sac'
    });
    sortAdvicesController.$inject=['progressAdviceService', '$state', '$filter'];
    function  sortAdvicesController(progressAdviceService, $state, $filter){
        var vm=this;
        vm.changeSort=changeSort;
        vm.download = download;
        vm.deleteAdvices = deleteAdvices;
        vm.canView = canViewDelete;
        vm.sortCriterias = [{"key":'Oldest first',"value":1},{"key":'Latest first',"value":-1}];
        vm.sortCriterias.selected =  vm.sortCriterias[1].value;
        function changeSort(sortStatus){
            vm.getAdvicesByStatus({status:vm.currentStatus, sortStatus:sortStatus,groupByStatus:vm.groupByStatus});
        }
        function download(type) {
            vm.downloadAllAdvicesByStatus({status:vm.currentStatus,type:type});
        }

        function canViewDelete() {
            return vm.canViewDelete()
        }

        function deleteAdvices(){
            progressAdviceService.deleteSeletedAdvicesModal(vm.deleteSeletedAdvices, function() {
                $state.go($state.current, {message:$filter('translate')('advices.deleted.success')},
                    {reload: true});
            });
        }
    }
}());
