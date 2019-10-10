'use strict';
(function(){
    angular.module('sbpo').component('renderPaymentRequests',{
        bindings: {
            data: '=',
            sortCriteria: '=',
            setDeletePaymentRequest: '&',
            getAllPaymentRequest: '&',
            canViewDelete: '&',
            getAllPaymentRequestByStatus: '&',
            currentStatus: '=',
            isShowNoRecordMessage: '=',
            selectProjectId:'=',
            emptyPaymentReq:'=',
            emptyPaymentReqProject:'=',
            paymentRequestsList : "="

        },
        templateUrl: '/app/partials/paymentRequests/renderPaymentRequests.html',
        controller:renderPaymentRequestsController,
        controllerAs:'rprc'
    });
    renderPaymentRequestsController.$inject=['paymentRequestService', '$rootScope', 'passUtilsService','AclService',
        '$filter','$stateParams','category','groupByCriteriaLimit','$scope', 'paymentReqStatus', '$state'];
    function  renderPaymentRequestsController(paymentRequestService, $rootScope, passUtilsService,AclService, $filter,
                                              $stateParams,category,groupByCriteriaLimit,$scope,paymentReqStatus,$state) {
        var vm = this;
        vm.closeOthers = true;
        vm.paymentReqSelection = {};
        vm.isAll = {};
        vm.isChildSeleted = {};
        vm.currentStateOn = $state.current.name
        vm.allPaymentRequestsByProject = {};
        vm.collectionOfPaymentRequest = {};
        vm.isShowNoRecordMessage = false;
        vm.currentStatus = $stateParams.status;
        vm.groupByCriteria = category.GROUP_PROJECT;
        vm.paymentRequestsList.adviceSkip = 0
        vm.paymentRequestsList.projectSkip = 0;
        vm.paymentRequestsList.projectLimit = groupByCriteriaLimit.PROJECT_LIST_LIMIT;
        vm.paymentRequestsList.adviceLimit = groupByCriteriaLimit.ADVICE_LIST_LIMIT;
        vm.limitChangeforProject = limitChangeforProject;
        vm.limitChangeForAdvice = limitChangeForAdvice
        vm.CanViewAddPaymentRequest = CanViewAddPaymentRequest;
        /*vm.freezeActionIcons=passUtilsService.freezeActionIcons()*/

        vm.deletePaymentRequests = collectionOfPaymentRequestToDelete;
        vm.showSuccessMessage = showSuccessMessage;
        vm.canView = canView;
        vm.selectAll = selectAll;
        vm.enableDisableParentChekBox = enableDisableParentChekBox;
        vm.tooltipText = tooltipText;
        vm.CanViewprojectsDropDown = CanViewprojectsDropDown;
        vm.getPaymentRequesterProjects = getPaymentRequesterProjects;
        vm.getAllPaymentRequests = getAllPaymentRequests;
        vm.getAllPaymentRequestByStatus = getAllPaymentRequestByStatus;
        vm.checkPaymentReqCount = checkPaymentReqCount;

        //checkPaymentReqCount();
        if ($rootScope.isPaymentRequester()) {
            getProjects();
            getPaymentRequesterProjects();
        }
        if ($rootScope.isInitiatorRole()) {
            vm.getAllPaymentRequestByStatus(vm.sortCriteria, vm.groupByCriteria, vm.currentStatus);
        }


        function tooltipText(groupedData) {
            return groupedData.open === true ? "" : $filter('translate')('check.box.tooltip.msg');
        }

        function CanViewprojectsDropDown() {
            return AclService.hasRole('ROLE_PAYMENT_REQUESTER');
        }

        /**
         * This function will unchecked checked all child checkboxes based on parent check box value
         * @param parentIndex
         */
        function selectAll(parentIndex) {
            //check if all selected or not
            if (vm.isAll[parentIndex] === true) {

                //set all child card selected
                for (var key in vm.collectionOfPaymentRequest) {
                    if ((Number(key) === parentIndex)) {
                        angular.forEach(vm.collectionOfPaymentRequest[key], function (paymentRequest, index) {
                            vm.paymentReqSelection[paymentRequest._id] = true
                        });
                    }
                }

            } else {
                //set all child card unselected
                for (var key in vm.collectionOfPaymentRequest) {
                    if ((Number(key) === parentIndex)) {
                        angular.forEach(vm.collectionOfPaymentRequest[key], function (paymentRequest, index) {
                            vm.paymentReqSelection[paymentRequest._id] = false;
                        });
                    }
                }
            }
            collectionOfPaymentRequestToDelete();
        }
/*
        $rootScope.$watch('$root.submittedPaymentReqCount',function (oldVal,newVal) {
            if(oldVal !== newVal) {
                checkPaymentReqCount()
            }
        });
        $rootScope.$watch('$root.approvedPaymentReqCount',function (oldVal,newVal) {
            if(oldVal !== newVal) {
                checkPaymentReqCount()
            }
        });
        $rootScope.$watch('$root.rejectedPaymentReqCount',function (oldVal,newVal) {
            if(oldVal !== newVal) {
                checkPaymentReqCount()
            }
        });*/
        function checkPaymentReqCount() {
            vm.count = 0;
            if(vm.currentStateOn === 'inprogressPaymentRequests') {
                vm.count = $rootScope.submittedPaymentReqCount;
            }
            else if(vm.currentStateOn === 'inProcessPaymentRequests') {
                vm.count = $rootScope.approvedPaymentReqCount;
            }
            else if(vm.currentStateOn === 'rejectedPaymentRequests') {
                vm.count = $rootScope.rejectedPaymentReqCount
            }
        }

        /**
         * This function will check user is having permission to see check-box and delete options
         */
        function canView() {
            return vm.canViewDelete();
        }

        /**
         * This function will get the payment request ids which we want to delete and stop the propagation
         * @param event
         */
        function collectionOfPaymentRequestToDelete() {
            vm.setDeletePaymentRequest({data: vm.paymentReqSelection});
        }

        /**
         * This function will unchecked checked parent checkbox
         * @param childCheckBox (true/false)
         * @param parentIndex
         */
        function enableDisableParentChekBox(childCheckBox, parentIndex) {
            var childCheckedList = [];
            if (!childCheckBox) {
                vm.isAll[parentIndex] = false;
            }
            else {
                //set parent check box selected if all child are checked
                for (var key in vm.collectionOfPaymentRequest) {
                    if ((Number(key) === parentIndex)) {
                        angular.forEach(vm.collectionOfPaymentRequest[key], function (paymentRequest, index) {
                            if (vm.paymentReqSelection[paymentRequest._id] !== false) {
                                childCheckedList.push(true);
                            } else {
                                childCheckedList.push(false);
                            }
                        });
                    }
                }
                if (childCheckedList.indexOf(false) === -1) {
                    vm.isAll[parentIndex] = true;
                }
                else {
                    vm.isChildSeleted[parentIndex] = true;
                    vm.isAll[parentIndex] = false;
                }
            }
        }

        function storePaymentReqIds(parentIndex) {
            for (var key in vm.collectionOfPaymentRequest) {
                if ((Number(key) === parentIndex)) {
                    angular.forEach(vm.collectionOfPaymentRequest[key], function (paymentRequest, index) {
                        if (vm.paymentReqSelection[paymentRequest._id] === undefined) {
                            vm.paymentReqSelection[paymentRequest._id] = false;
                        }
                    });
                }
            }
        }


        function CanViewAddPaymentRequest() {
            return AclService.hasRole('ROLE_PAYMENT_REQUESTER');
        }

        vm.showPaymentRequests = function (groupedPaymentReqData, parentIndex, status, projectId) {
            if(groupedPaymentReqData.advices){
                angular.forEach(groupedPaymentReqData.advices,function(eachAdvice,index){
                    eachAdvice.open= false
                })
            }
            if (!groupedPaymentReqData.open || vm.paymentRequestsList) {
                vm.groupByCriteria = "PaymentRequest";
                vm.totalAdvicesCount = groupedPaymentReqData.paymentRequestCount
                if (vm.emptyPaymentReq === true || !vm.paymentRequestsList.projects[parentIndex].adviceSkip) {
                    vm.paymentRequestsList.projects[parentIndex].adviceSkip = 0
                }
                var query = {
                    sortCriteria: vm.sortCriteria,
                    groupByCriteria: vm.groupByCriteria,
                    status: status,
                    adviceSkip: vm.paymentRequestsList.projects[parentIndex].adviceSkip,
                    adviceLimit: vm.paymentRequestsList.adviceLimit
                };
                if ($rootScope.isInitiatorRole()) {
                    query.projectId = groupedPaymentReqData._id;
                } else {
                    query.projectId = projectId
                }
                vm.emptyPaymentReq = false;
                paymentRequestService.listAllPaymentRequestByStatus(query).then(function (response) {
                    if(response.data === undefined || response.data.length ===0) {
                        vm.emptyPaymentReq = true;
                    }
                    vm.allPaymentRequestsByProject[parentIndex] = response.data;
                    vm.collectionOfPaymentRequest[parentIndex] = response.data;
                    if (vm.paymentRequestsList.projects[parentIndex].adviceSkip === 0) {
                        vm.paymentRequestsList.projects[parentIndex].advices = response.data
                    }
                    else {
                        updatePaymentRequestAdvices(response.data, parentIndex)
                    }
                    storePaymentReqIds(parentIndex);
                }, function (error) {
                    console.log(error)
                });
            }
            $rootScope.$on('sortEvent', function (event) {
                groupedPaymentReqData.open = false
            })
        };

        function getProjects() {
            paymentRequestService.getProjects().then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                vm.projects = response.data;
            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }

//callinmg the entire logic here
        function getAllPaymentRequestByStatus(sortCriteria, groupByCriteria, status, projectId) {
            vm.selectProjectId = projectId;
            vm.sortCriteria = sortCriteria;
            vm.groupByCriteria = groupByCriteria;
            var query = {
                sortCriteria: sortCriteria,
                groupByCriteria: category.GROUP_PROJECT,
            }
            if ($rootScope.isInitiatorRole()) {
                query.projectSkip = vm.paymentRequestsList.projectSkip,
                    query.projectLimit = vm.paymentRequestsList.projectLimit;
            }
            if (projectId) {
                query.projectId = projectId;
            }
            query.status = vm.currentStatus;
            vm.emptyPaymentReqProject = false;
            paymentRequestService.listAllPaymentRequestByStatus(query).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                $rootScope.$broadcast('updatePaymentReqCount', { project:projectId});
                if (response.data === undefined || response.data === 'empty' || response.data.paymentRequests.length === 0) {
                    vm.isShowNoRecordMessage = true;
                    vm.emptyPaymentReqProject = true;
                    vm.data = {};
                    var statusToShow  = vm.currentStatus;
                    if(statusToShow == paymentReqStatus.APPROVED) {
                        vm.noRecordMessage = $filter('translate')('payment.request.not.found.errorMsg',{status:"processed"})
                    }
                    else if(statusToShow == paymentReqStatus.SUBMITTED) {
                        vm.noRecordMessage = $filter('translate')('payment.request.not.found.errorMsg',{status:"un-processed"})
                    }
                    else if(statusToShow == paymentReqStatus.REJECTED) {
                        vm.noRecordMessage = $filter('translate')('payment.request.not.found.errorMsg',{status:"rejected"})
                    }
                } else {
                    vm.isShowNoRecordMessage = false;
                    vm.emptyPaymentReqProject = false;
                    vm.data = response.data.paymentRequests;
                    if (response.data.totalProjectCount) {
                        vm.paymentRequestsList.totalProjectCount = response.data.totalProjectCount;
                    }
                    if (vm.paymentRequestsList.projectSkip === 0) {
                        vm.paymentRequestsList.projects = response.data.paymentRequests;

                    }
                    else {
                        updatePaymentRequests(response.data.paymentRequests)
                    }
                    /*vm.data = response.data.paymentRequests;*/
                }
            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }


        function getAllPaymentRequests(sortCriteria, groupByCriteria, projectId) {
            vm.sortCriteria = sortCriteria;
            vm.groupByCriteria = groupByCriteria;
            var query = {sortCriteria: sortCriteria, groupByCriteria: category.GROUP_PROJECT}
            if (projectId) {
                query.projectId = projectId;
            }
            paymentRequestService.listAllPaymentRequest(query).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                if (response.data === undefined || response.data === 'empty' || response.data.length === 0) {
                    vm.noRecordMessage = $filter('translate')('payment.request.not.found');
                    vm.isShowNoRecordMessage = true;
                } else {
                    vm.data = response.data;
                }
            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }

        function getPaymentRequesterProjects() {
            var query = $rootScope.getCurrentLoggedInUser()._id;
            paymentRequestService.listAsignedProjects(query).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                if (response.data) {
                    console.log("____________123");
                    vm.project = {};
                    vm.project.selected = response.data;
                    getAllPaymentRequestByStatus(-1, category.GROUP_PROJECT, vm.currentStatus, response.data._id);

                }

            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }

        function showSuccessMessage() {
            vm.message = $stateParams.message;
            Flash.create('success', vm.message, 'paymentRequestFlashMessage');

        }

        vm.getPaymentRequestById = function (paymentRequest) {
            paymentRequestService.getPaymentRequestsById(paymentRequest._id).then(function (response) {
                if (response.status == 200) {
                    updateProcessedPayment(response.data)
                }
            }, function (error) {
                console.log(error)
            });
        }
        function limitChangeForAdvice(parentIndex) {
            if (vm.emptyPaymentReq === true || vm.totalAdvicesCount === vm.paymentRequestsList.projects[parentIndex].advices.length) {
                vm.paymentRequestsList.projects[parentIndex].adviceSkip = 0
            }
            else {
                vm.paymentRequestsList.projects[parentIndex].adviceSkip = vm.paymentRequestsList.projects[parentIndex].adviceSkip + vm.paymentRequestsList.adviceLimit;
            }
            $rootScope.$broadcast('updatePaymentReqCount');
            checkPaymentReqCount();
        }

        function limitChangeforProject(skip) {
            if (vm.emptyPaymentReqProject === true || vm.paymentRequestsList.totalProjectCount === vm.paymentRequestsList.projects.length) {
                vm.paymentRequestsList.projectSkip = 0
            } else {
                vm.paymentRequestsList.projectSkip = vm.paymentRequestsList.projectLimit + skip;
            }
            $rootScope.$broadcast('updatePaymentReqCount');
            checkPaymentReqCount();
        }

        function updatePaymentRequests(paymentRequestsProjects) {
            paymentRequestsProjects.forEach(function (eachProject) {
                var index = passUtilsService.findIndexByKeyAndValue(vm.paymentRequestsList.projects, '_id', eachProject._id);
                if (index === -1) {
                    vm.paymentRequestsList.projects.push(eachProject);
                }
            })
        }

        function updatePaymentRequestAdvices(paymentRequestadvices, parentIndex) {
            paymentRequestadvices.forEach(function (eachAdvice) {
                var index = passUtilsService.findIndexByKeyAndValue(vm.paymentRequestsList.projects[parentIndex].advices, '_id', eachAdvice._id);
                if (index === -1) {
                    vm.paymentRequestsList.projects[parentIndex].advices.push(eachAdvice)
                }
            });
        }

        function updateProcessedPayment(paymentRequest) {
            for (var i = 0; i < vm.paymentRequestsList.projects.length; i++) {
                var eachProject = vm.paymentRequestsList.projects[i]
                if (eachProject._id === paymentRequest.project._id) {
                    for (var j = 0; j < eachProject.advices.length; j++) {
                        var eachAdvice = eachProject.advices[j]
                        if (eachAdvice.paymentRequestNumber === paymentRequest.paymentRequestNumber) {
                            eachAdvice.adviceNumber = paymentRequest.adviceNumber
                        }
                    }
                }
            }
        }
    }
}());

