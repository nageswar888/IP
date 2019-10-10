'use strict';
(function(){
    angular.module('sbpo').component('renderAdvices',{
        bindings: {
            status: '=',
            data: '=',
            groupCategory:'=',
            getAdvices: '&',
            getDeleteAdvices: '&',
            canViewDelete: '&',
            showAdvicesInTable: '=',
            showTotalAmount: '=',
            viewAdviceDetails:'&',
            downloadAdvicePdf:'&',
            groupByCriteriaList: '=',
            searchAdvices: "&",
            searchParams :"=",
            groupBySeletedCriteria:"="
        },
        template: require('../partials/advices.html'),
        controller:renderAdvicesController,
        controllerAs:'rac'
    });
    renderAdvicesController.$inject=['passUtilsService', 'category', '$timeout','$scope', '$filter','groupByCriteriaLimit','$state','$rootScope','states','Flash'];
    function  renderAdvicesController(passUtilsService, category, $timeout, $scope, $filter,groupByCriteriaLimit,$state,$rootScope,states,Flash) {
        /*
         *
         */
        var vm = this;
        vm.adviceLimit = groupByCriteriaLimit.ADVICE_LIST_LIMIT;
        vm.groupLimit = groupByCriteriaLimit.PROJECT_LIST_LIMIT;
        vm.setGroupByCriteriaParams=setGroupByCriteriaParams
        vm.closeOthers = true;
        vm.adviceCardSelection = {};
        vm.isAll = {};
        vm.isChildSeleted = {};
        vm.adviceToDelete = [];
        vm.collectionOfAdvices = {};
        vm.moreProjects = true;
        vm.currentState=$state.current.name
        vm.viewPendingCardButton = viewPendingCardButton;
        vm.showAdvices = showAdvices;
        vm.deleteAdvices = deleteAdvices;
        vm.canView = canViewDelete;
        vm.tooltipText = tooltipText;
        vm.selectAllRows = selectAllRows;
        vm.enableDisableParentChekBox = enableDisableParentChekBox;
        vm.limitChangeforAdvice = limitChangeforAdvice;
        vm.limitChangeforProject = limitChangeforProject;
        vm.setGroupByCriteriaParamsForSearch=setGroupByCriteriaParamsForSearch;
        vm.lessChangeforProject=lessChangeforProject;
        vm.refreshData=refreshData;
        vm.eachAdviceCount = {};
        vm.dataModified = false;


        function tooltipText(groupedData) {
            return groupedData.open === true ? "": $filter('translate')('check.box.tooltip.msg');
        }

        /**
         * This function will unchecked checked parent checkbox
         * @param childCheckBox (true/false)
         * @param parentIndex
         */
        function enableDisableParentChekBox(childCheckBox,parentIndex) {
            var childCheckedList = [];
            if(!childCheckBox) {
                vm.isAll[parentIndex] = false;
            }
            else {
                //set parent check box selected if all child are checked
                for(var key in vm.collectionOfAdvices) {
                    if((Number(key) === parentIndex)) {
                        angular.forEach(vm.collectionOfAdvices[key], function (advice, index) {
                            if (vm.adviceCardSelection[advice._id] !== false) {
                                childCheckedList.push(true);
                            } else {
                                childCheckedList.push(false);
                            }
                        });
                    }
                }
                if(childCheckedList.indexOf(false) === -1) {
                    vm.isAll[parentIndex] = true;
                }
                else {
                    vm.isChildSeleted[parentIndex] = true;
                    vm.isAll[parentIndex] = false;
                }
            }
        }

        /**
         * This function will check user is having permission to see check-box and delete options
         */
        function canViewDelete() {
            return vm.canViewDelete()
        }

        /**
         * This function will unchecked checked all child checkboxes based on parent check box value
         * @param parentIndex
         */
        function selectAllRows(parentIndex) {
            //check if all selected or not
            if (vm.isAll[parentIndex] === true) {

                //set all child card selected
                for(var key in vm.collectionOfAdvices) {
                    if((Number(key) === parentIndex)) {
                        angular.forEach(vm.collectionOfAdvices[key], function (advice, index) {
                            vm.adviceCardSelection[advice._id] = true
                        });
                    }
                }

            } else {
                //set all child card unselected
                for(var key in vm.collectionOfAdvices) {
                    if((Number(key) === parentIndex)) {
                        angular.forEach(vm.collectionOfAdvices[key], function (advice, index) {
                            vm.adviceCardSelection[advice._id] = false;
                        });
                    }
                }
            }
            deleteAdvices();
        }


        /**
         * This function will get the advices id which we want to delete
         */
        function deleteAdvices() {
            vm.getDeleteAdvices({data:vm.adviceCardSelection});
        }

        function viewPendingCardButton(status){
            return passUtilsService.canViewPendingAdvice(status);
        }

        function storeAdviceIds(parentIndex){
            for(var key in vm.collectionOfAdvices){
                if((Number(key) === parentIndex)){
                    angular.forEach(vm.collectionOfAdvices[key], function (advice, index) {
                        if (vm.adviceCardSelection[advice._id] === undefined) {
                            vm.adviceCardSelection[advice._id] = false;
                        }
                    });
                }
            }
        }

        function showAdvices(groupedData, parentIndex){
            $rootScope.$on('searchGroupByViewEvent', function (event) {

                if(groupedData) {
                    if (groupedData && groupedData.open) {
                        if (vm.currentState === 'searchAdvice') {
                            vm.searchParams.groupByCriteria = vm.groupBySeletedCriteria.key;
                            vm.searchParams.projectId = undefined
                            vm.searchParams.afterSuccess = undefined
                            vm.searchParams.categoryId=undefined
                            vm.searchParams.payeeId=undefined
                            vm.searchParams.paymentTypeId=undefined

                            groupedData.open = false;
                        }
                    }
                    else if(groupedData && !groupedData.open && vm.currentState === 'searchAdvice') {
                        vm.searchParams.groupByCriteria = vm.groupBySeletedCriteria.key;
                        vm.searchParams.projectId = undefined;
                        vm.searchParams.categoryId=undefined
                        vm.searchParams.payeeId=undefined
                        vm.searchParams.paymentTypeId=undefined

                        vm.searchParams.afterSuccess = undefined
                        groupedData.open = true;
                    }
                }
            });
            $timeout(function () {
                if (groupedData.advices) {
                    angular.forEach(groupedData.advices, function (eachAdvice, index) {
                        eachAdvice.open = false
                    })
                }
                vm.collectionOfAdvices[parentIndex] = groupedData.advices;
                storeAdviceIds(parentIndex);
            }, 1000);
            if (!groupedData.open || vm.groupByCriteriaList) {
                var params = {
                    status: vm.currentStatus,
                    groupCategory: category.GROUP_ADVICE,
                    groupedData: groupedData
                };
                if (vm.groupByCriteriaList && vm.groupByCriteriaList.projects) {
                    if (!vm.groupByCriteriaList.projects[parentIndex].hasOwnProperty('adviceSkip')) {
                        vm.eachAdviceCount[parentIndex] = 0
                    }
                }
                if (vm.groupCategory === category.GROUP_PROJECT) {
                    params.projectId = groupedData.project._id;
                } else if (vm.groupCategory === category.GROUP_PAYEE) {
                    params.payeeId = groupedData.payee._id;
                } else if (vm.groupCategory === category.GROUP_PAYMENT_TYPE) {
                    if (groupedData.paymentType) {
                        params.paymentTypeId = groupedData.paymentType._id;
                    }
                    else {
                        params.paymentTypeId = null;
                    }

                } else if (vm.groupCategory === category.GROUP_CATEGORY) {
                    if (groupedData.category) {
                        params.categoryId = groupedData.category._id;
                    }
                    else {
                        params.categoryId = null;
                    }

                }
                vm.getAdvices(params);
            }
        }
        //changing offset for advices
        function limitChangeforAdvice(projectId, parentIndex,advicesCount) {
            for (var i = 0; i < vm.groupByCriteriaList.projects.length; i++) {
                var eachProject = vm.groupByCriteriaList.projects[i];
                if (eachProject._id === projectId) {
                    if (!eachProject.adviceSkip) {
                        eachProject.adviceSkip = vm.adviceLimit;
                    }
                    else if ($rootScope.emptyAdvices === true || eachProject.advices.length === advicesCount) {
                        eachProject.adviceSkip = 0;
                    }
                    else {
                        eachProject.adviceSkip = eachProject.adviceSkip + vm.adviceLimit;

                    }
                    vm.eachAdviceCount[parentIndex] = eachProject.adviceSkip;
                    break;
                }
            }
            $rootScope.$broadcast('updateAdviceCount');
        }
        //changing offset for project
        function limitChangeforProject(skip,more) {
            if(skip===null || skip===undefined){
                skip=0;
            }
            vm.groupByCriteriaList.more = 'more'
            if (vm.groupByCriteriaList.projects) {
                if ($rootScope.emptyAdvices === true || vm.groupByCriteriaList.totalProjectCount === vm.groupByCriteriaList.projects.length) {
                    vm.groupByCriteriaList.groupSkip = 0
                }
                else {
                    vm.groupByCriteriaList.groupSkip = vm.groupLimit + skip;
                }
            }
            else {
                if (vm.groupByCriteriaList.totalProjectCount < vm.groupByCriteriaList.groupSkip + vm.groupLimit || vm.groupByCriteriaList.totalProjectCount === vm.groupByCriteriaList.groupSkip + vm.groupLimit) {
                    vm.groupByCriteriaList.groupSkip = 0
                }
                else {
                    vm.groupByCriteriaList.groupSkip = vm.groupLimit + skip;
                    vm.showMore=true;
                }
            }
            $rootScope.$broadcast('updateAdviceCount');
        }

        /**
         * This method will refresh the data and load all previous data based on last skip value
         */
        function refreshData() {
            vm.groupByCriteriaList.projects=[];
            vm.lastSkipValue = vm.groupByCriteriaList.groupSkip;
            vm.groupByCriteriaList.groupSkip=0;
            var params = {
                status: vm.currentStatus
            }
            params.groupCategory = vm.groupCategory;
            vm.dataModified = false;
            $rootScope.refreshed = false;
            for(var i=0;i<=vm.lastSkipValue;i+=groupByCriteriaLimit.PROJECT_LIST_LIMIT) {
                vm.groupByCriteriaList.groupSkip=i;
                vm.getAdvices(params);
            }
        }

        /**
         * Monitor pending count if updated set dataModified flag true
         */
        $rootScope.$watch('$root.pendingCount', function (newValue, oldvalue) {
            if(oldvalue && (newValue > oldvalue || newValue < oldvalue)) {
                vm.dataModified = true
            }
            else {
                vm.dataModified = false
            }
        });

        /**
         * Monitor inprogress count if updated set dataModified flag true
         */
        $rootScope.$watch('$root.totalInprogressCount', function (newValue, oldvalue) {
            if(oldvalue && (newValue > oldvalue || newValue < oldvalue) ) {
                vm.dataModified = true
            }
            else {
                vm.dataModified = false
            }
        });

        /**
         * Monitor rejected count if updated set dataModified flag true
         */
        $rootScope.$watch('$root.rejectedCount', function (newValue, oldvalue) {
            if(oldvalue && (newValue > oldvalue || newValue < oldvalue)) {
                vm.dataModified = true
            }
            else {
                vm.dataModified = false
            }
        });

        //setting params based on groupBy criteria
        function setGroupByCriteriaParams(groupedData) {
            if (!groupedData) {
                var params = {
                    status: vm.currentStatus,
                }
                if (vm.groupCategory === category.GROUP_PROJECT) {
                    params.groupCategory = category.GROUP_PROJECT;
                } else if (vm.groupCategory === category.GROUP_PAYEE) {
                    params.groupCategory = category.GROUP_PAYEE;
                }

                vm.getAdvices(params);
            }
        }

        function setGroupByCriteriaParamsForSearch() {
            //calling $broadcast service to set params for search
            $rootScope.$broadcast("searchGroupByViewEvent");
            vm.searchAdvices(vm.searchParams);
        }
        function lessChangeforProject(skip){
            if (vm.groupByCriteriaList.totalProjectCount < vm.groupByCriteriaList.groupSkip + vm.groupLimit || vm.groupByCriteriaList.totalProjectCount === vm.groupByCriteriaList.groupSkip + vm.groupLimit) {
                vm.groupByCriteriaList.groupSkip = 0
                vm.showMore=false;
            }
            else {
                if(skip - vm.groupLimit === vm.groupByCriteriaList.groupSkip){
                    vm.showMore=false;
                }
                vm.groupByCriteriaList.groupSkip =skip - vm.groupLimit;

            }

        }
    }
}());
