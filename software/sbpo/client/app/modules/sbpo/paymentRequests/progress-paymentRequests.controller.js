'use strict';
(function() {
    angular
        .module('sbpo.paymentRequest')
        .controller('progressPaymentRequestController', progressPaymentRequestController)
    progressPaymentRequestController.$inject=['paymentRequestService','$state','$stateParams','Flash','$filter','category','AclService','downloadConstants','passUtilsService','$rootScope','groupByCriteriaLimit'];
    function progressPaymentRequestController(paymentRequestService,$state,$stateParams,Flash,$filter,category,AclService,downloadConstants,passUtilsService,$rootScope,groupByCriteriaLimit){
        var vm=this;
        vm.showSuccessMessage = showSuccessMessage;
        vm.showSuccessMessage();

        vm.closeOthers = true;
        vm.paymentReqSelection = {};
        vm.isAll = {};
        vm.isChildSeleted = {};
        vm.allPaymentRequestsByProject = {};
        vm.collectionOfPaymentRequest = {};
        vm.CanViewAddPaymentRequest = CanViewAddPaymentRequest;
        /*vm.freezeActionIcons=passUtilsService.freezeActionIcons();*/
        vm.groupByCriteria=category.GROUP_PROJECT;
        vm.isShowNoRecordMessage = false;
       /* vm.showSuccessMessage = showSuccessMessage;
        vm.showSuccessMessage();*/
        vm.download = download;
        vm.paymentReqToDelete = [];
        vm.canView = canViewDeletePaymentReqOption;
        vm.deletePaymentRequests = deletePaymentRequests;
        vm.currentStatus = $stateParams.status;
        vm.isInitiator = $rootScope.isInitiatorRole();
        vm.isPR = $rootScope.isPaymentRequester();
        vm.projectId="";
        vm.paymentRequestsList={
            projects:[{
                advices:[]
            }]
        }
        vm.paymentRequestsList.projectSkip=0;

        //function for showing success messages
        function showSuccessMessage(){
            console.log("methode  is getting call");
            console.log($stateParams.message);
            if($stateParams.message){
                Flash.create('success',$stateParams.message,'FlashMsgDiv');
            }
        }
        //vm.deletePaymentRequests = collectionOfPaymentRequestToDelete;
        vm.selectAll = selectAll;
        vm.enableDisableParentChekBox = enableDisableParentChekBox;
        vm.tooltipText = tooltipText;
        vm.CanViewprojectsDropDown = CanViewprojectsDropDown;
        vm.getAllPaymentRequestByStatus = getAllPaymentRequestByStatus;
        vm.setDeletePaymentRequest = setDeletePaymentRequest;
        vm.noRecordMessage = $filter('translate')('payment.request.not.found');
        function tooltipText(groupedData) {
            return groupedData.open === true? "": $filter('translate')('check.box.tooltip.msg');
        }

        function CanViewprojectsDropDown(){
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
                for(var key in vm.collectionOfPaymentRequest){
                    if((Number(key) === parentIndex) ) {
                        angular.forEach(vm.collectionOfPaymentRequest[key], function(paymentRequest, index) {
                            vm.paymentReqSelection[paymentRequest._id] = true
                        });
                    }
                }

            } else {
                //set all child card unselected
                for(var key in vm.collectionOfPaymentRequest){
                    if((Number(key) === parentIndex) ) {
                        angular.forEach(vm.collectionOfPaymentRequest[key], function(paymentRequest, index) {
                            vm.paymentReqSelection[paymentRequest._id] = false;
                        });
                    }
                }
            }
            collectionOfPaymentRequestToDelete();
        }


        /**
         * This function will get the payment request ids which we want to delete and stop the propagation
         * @param event
         */
        function collectionOfPaymentRequestToDelete() {
            vm.setDeletePaymentRequest({data:vm.paymentReqSelection});
        }

        function deletePaymentRequests() {
            paymentRequestService.deletePaymentReqPasscodeModal(vm.paymentReqToDelete, true, function () {
                $state.go($state.current, {message: $filter('translate')('payment.req.deleted.success')},
                    {reload: true});
            });
        }

        function setDeletePaymentRequest(paymentReq) {
            for (var key in paymentReq) {
                if ((paymentReq[key] === true) && vm.paymentReqToDelete.indexOf(key) === -1) {
                    vm.paymentReqToDelete.push(key)
                }
                else if ((paymentReq[key] === false) && vm.paymentReqToDelete.indexOf(key) !== -1) {
                    for (var i = vm.paymentReqToDelete.length - 1; i >= 0; i--) {
                        if (vm.paymentReqToDelete[i] === key) {
                            vm.paymentReqToDelete.splice(i, 1);
                        }
                    }
                }
            }
        }

       /* vm.freezeActionItems = passUtilsService.freezeActionIcons();
        if ($rootScope.isAuthenticated()) {
            $rootScope.$broadcast('updatePaymentReqCount');
        }*/

        if ($rootScope.isInitiatorRole()) {
            getAllPaymentRequestByStatus(-1, vm.groupByCriteria);
        }


        function download(type) {
            console.log("pprc.projectId_____",vm.projectId);
            var query = {type: type,paymentStatus:vm.currentStatus,projectId:vm.projectId};
            window.open('/api/advices/downloadPaymentRequest?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));

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
                for(var key in vm.collectionOfPaymentRequest){
                    if((Number(key) === parentIndex) ) {
                        angular.forEach(vm.collectionOfPaymentRequest[key], function(paymentRequest, index) {
                            if (vm.paymentReqSelection[paymentRequest._id] !== false) {
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
        function canViewDeletePaymentReqOption() {
            return ((AclService.hasAnyRole(['ROLE_INITIATOR'])));
        }

        function storePaymentReqIds(parentIndex) {
            for(var key in vm.collectionOfPaymentRequest){
                if((Number(key) === parentIndex) ) {
                    angular.forEach(vm.collectionOfPaymentRequest[key], function(paymentRequest, index) {
                        if(vm.paymentReqSelection[paymentRequest._id] === undefined) {
                            vm.paymentReqSelection[paymentRequest._id] = false;
                        }
                    });
                }
            }
        }


        function CanViewAddPaymentRequest(){
            return AclService.hasRole('ROLE_PAYMENT_REQUESTER');
        }

        vm.showPaymentRequests = function(groupedPaymentReqData, parentIndex,projectId) {
            console.log("_____projectId",projectId);
            if (!groupedPaymentReqData.open) {
                vm.groupByCriteria = "PaymentRequest";
                var query = {
                    sortCriteria: vm.sortCriteria,
                    groupByCriteria: vm.groupByCriteria,
                    projectId:projectId
                };
                paymentRequestService.getAllPaymentRequestsByProjectId(query).then(function(response){
                    vm.allPaymentRequestsByProject[parentIndex] =response.data;
                    vm.collectionOfPaymentRequest[parentIndex] = response.data;
                    storePaymentReqIds(parentIndex);
                }, function(error) {
                    console.log(error)
                });
            }
        };

        function getAllPaymentRequestByStatus(sortCriteria, groupByCriteria) {
            console.log("getAllPaymentRequestByStatus method");
            vm.sortCriteria = sortCriteria;
            vm.groupByCriteria = groupByCriteria;
            var query = {sortCriteria: sortCriteria, groupByCriteria: category.GROUP_PROJECT,status : vm.currentStatus}
            if($rootScope.isInitiatorRole()){
            query.projectSkip=vm.paymentRequestsList.projectSkip,
                query.projectLimit=groupByCriteriaLimit.PROJECT_LIST_LIMIT
            }
            else if(vm.projectId){
                query.projectId=vm.projectId
            }
            vm.emptyPaymentReq = false;
            vm.emptyPaymentReqProject = false;
            paymentRequestService.listAllPaymentRequestByStatus(query).then(handleReadProjectsSuccess).catch(handleReadProjectsFailure);
            function handleReadProjectsSuccess(response) {
                if (response.data === undefined || response.data === 'empty' || response.data.length === 0) {
                    vm.emptyPaymentReq = true;
                    vm.emptyPaymentReqProject = true;
                    vm.isShowNoRecordMessage = true;
                    vm.data = {};
                    vm.noRecordMessage = $filter('translate')('payment.request.not.found');
                } else {
                    vm.isShowNoRecordMessage = false;
                    /*vm.data = response.data.paymentRequests;*/
                    if(response.data.totalProjectCount){
                        vm.paymentRequestsList.totalProjectCount = response.data.totalProjectCount;
                    }
                    if(vm.paymentRequestsList.projectSkip ===0){
                        vm.paymentRequestsList.projects = response.data.paymentRequests;
                    }
                    else{
                        updatePaymentRequests(response.data.paymentRequests)
                    }

                }
            }

            function handleReadProjectsFailure(error) {
                console.log(error);
            }
        }

        vm.getPaymentRequestById = function(paymentRequest) {
            paymentRequestService.getPaymentRequestsById(paymentRequest._id).then(function(response){
                vm.paymentRequestInfo =response.data;
            }, function(error) {
                console.log(error)
            });
        }
        function updatePaymentRequests(paymentRequestsProjects){
            console.log("updatePaymentRwequests")
            paymentRequestsProjects.forEach(function(eachProject){
                var index = passUtilsService.findIndexByKeyAndValue(vm.paymentRequestsList.projects, '_id', eachProject._id);
                if (index === -1) {
                    vm.paymentRequestsList.projects.push(eachProject);
                }
            })
        }
    }
}());
