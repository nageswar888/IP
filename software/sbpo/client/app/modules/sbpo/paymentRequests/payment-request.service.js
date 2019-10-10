'use strict';
(function () {
    angular
        .module('sbpo.paymentRequest')
        .factory('paymentRequestService', paymentRequestService);
    paymentRequestService.$inject = ['api','$q', '$uibModal', '$rootScope','$filter','Flash'];

    function paymentRequestService(api, $q, $uibModal, $rootScope, $filter, Flash) {
        var service = {
            submitPaymentRequest : submitPaymentRequest,
            rejectPaymentRequest : rejectPaymentRequest,
            listAsignedProjects : listAsignedProjects,
            listAllPaymentRequest: listAllPaymentRequest,
            getAssignedProjectsByUserId: listAssignedProjectsByUserID,
            getAllPaymentRequestsByProjectId: getAllPaymentRequestsByProjectId,
            getPaymentRequestsById: getPaymentRequestsById,
            rejectPaymentRequestModal : rejectPaymentRequestModal,
            approvePaymentRequest : approvePaymentRequest,
            deletePaymentReqPasscodeModal: deletePaymentReqPasscodeModal,
            deletePaymentRequest: deletePaymentRequest,
            getPaymentRequestCount: getPaymentRequestCount,
            getCommentsByPaymentRequest:getCommentsByPaymentRequest,
            deleteSelectedPaymentRequests: deleteSelectedPaymentRequests,
            listAllPaymentRequestByStatus: listAllPaymentRequestByStatus,
            getProjects: getProjects
        };
        return service;



        function getCommentsByPaymentRequest(query){
            return api.getCommentsByPaymentRequest({q: query}).$promise;
        }
        function submitPaymentRequest(query){
            return api.submitPaymentRequest({q: query}).$promise;
        }

        function getPaymentRequestCount(query) {
            return api.getPaymentRequestCount({q:query}).$promise;
        }

        function listAsignedProjects(query){
            return api.paymentRequesterProjectList({q:query}).$promise;
        }

        function listAssignedProjectsByUserID(query) {
            return api.paymentRequesterProjectListByUserID({q:query}).$promise;
        }

        function listAllPaymentRequest(query){
            return api.paymentRequestList({q:query}).$promise;
        }

        function rejectPaymentRequest(query){
            return api.RejectPaymentRequest({q:query}).$promise;
        }

        function approvePaymentRequest(query){
            return api.approvePaymentRequest({q:query}).$promise;
        }

        function getAllPaymentRequestsByProjectId(query) {
            return api.paymentRequestListByProjectId({q:query}).$promise;
        }

        function getPaymentRequestsById(id) {
            return api.paymentRequestById({id:id}).$promise;
        }

        function deletePaymentRequest(id,passcode) {
            var queryParams={
                passCode:passcode,
                id: id
            };
            var query = angular.extend({},queryParams);
            return api.deletePaymentRequest({q:query}).$promise;
        }

        function deleteSelectedPaymentRequests(ids,passcode) {
            var queryParams={
                passCode:passcode,
                ids: ids
            };
            var query = angular.extend({},queryParams);
            return api.deleteSelectedPaymentRequests({q:query}).$promise;
        }

        function rejectPaymentRequestModal(id, afterRejected){
            var uibModalInstance = $uibModal.open({
                templateUrl: '/app/partials/paymentRequests/paymentRequestPasscodeConfirm.html',
                controller: function ($scope,$uibModalInstance,paymentRequestService) {
                    $scope.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                    $scope.rejectPaymentRequestConfirm = function () {
                        var query={
                            id:id,
                            passcode:$scope.passcode,
                            comment:$scope.comment,
                            user:$rootScope.getCurrentLoggedInUser()._id
                        };
                        paymentRequestService.rejectPaymentRequest(query).then(handleRejectPaymentREquestSuccess).catch(handleRejectPaymentREquestFail);
                        function handleRejectPaymentREquestSuccess(response) {
                            if (response.status == 404) {
                                Flash.create('danger', $filter('translate')('payment.request.not.found'), 'rejectFlashMsgDiv');
                            } else if (response.status == 304) {
                                Flash.create('danger', $filter('translate')('user.passcode.notMatching'), 'rejectFlashMsgDiv');
                            } else if (response.status == 402) {
                                Flash.create('danger', $filter('translate')('advice.comment.required'), 'rejectFlashMsgDiv');
                            }
                            else {
                                afterRejected();
                                $rootScope.$broadcast('updatePaymentReqCount');
                                $uibModalInstance.close();
                            }

                        }

                        function handleRejectPaymentREquestFail(error) {
                            console.log(error);
                        }

                    }
                }
            });
            $uibModalInstance.close();
        }

        //function for opening passcode modal and calling delete function
        function deletePaymentReqPasscodeModal(id,deleteValue, afterDeleted){
            var uibModalInstance = $uibModal.open({
                templateUrl: '/app/partials/paymentRequests/deletePaymentRequest.html',
                controller: function ($scope,$uibModalInstance,paymentRequestService, Flash) {
                    $scope.deleteValue = deleteValue;
                    $scope.closePopup = closePopup;
                    $scope.deletePaymentRequest = deletePaymentRequest;
                    $scope.deleteSelectedPaymentRequest = deleteSelectedPaymentRequest;
                    $scope.ids = id;
                    function closePopup() {
                        $uibModalInstance.dismiss('cancel');
                    };

                    function deleteSelectedPaymentRequest() {
                        paymentRequestService.deleteSelectedPaymentRequests(id,$scope.passcode)
                            .then(handleDeleteSelectedPaymentRequestSuccess)
                            .catch(handleDeleteSelectedPaymentRequestFail);

                        function handleDeleteSelectedPaymentRequestSuccess(response){
                            if(response.status==500){
                                Flash.create('danger',(response.messages),'paymentReqFlashMsgDiv');
                            }
                            else if(response.status === 304) {
                                Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'paymentReqFlashMsgDiv');
                            }
                            else if(response.status === 550) {
                                Flash.create('danger', (response.messages),'paymentReqFlashMsgDiv');
                            }
                            else if(response.status === 200) {
                                if(afterDeleted) {
                                    afterDeleted();
                                }
                                $rootScope.$broadcast('updatePaymentReqCount');
                                $uibModalInstance.dismiss('cancel');
                            }
                            else {
                                Flash.create('danger',(response.messages),'paymentReqFlashMsgDiv');
                            }

                        }
                        function handleDeleteSelectedPaymentRequestFail(error){
                            console.log("Delete selected payment request Error :",error);
                        }
                    }

                    function deletePaymentRequest() {
                        paymentRequestService.deletePaymentRequest(id,$scope.passcode)
                            .then(handleDeletePaymentREquestSuccess)
                            .catch(handleDeletePaymentREquestFail);
                        function handleDeletePaymentREquestSuccess(response){
                            if(response.status === 404){
                                Flash.create('danger', $filter('translate')(response.messages),'paymentReqFlashMsgDiv');
                            }
                            else if(response.status === 500){
                                Flash.create('danger', $filter('translate')(response.messages),'paymentReqFlashMsgDiv');
                            }
                            else if(response.status === 304) {
                                Flash.create('danger', $filter('translate')('user.passcode.notMatching'),'paymentReqFlashMsgDiv');
                            }
                            else{
                                if(afterDeleted) {
                                    afterDeleted();
                                }
                                $rootScope.$broadcast('updatePaymentReqCount');
                                $uibModalInstance.dismiss('cancel');
                            }
                        }
                        function handleDeletePaymentREquestFail(error){
                            console.log(error);
                        }

                    }
                }
            });
        }

        function getProjects() {
            return api.getPaymentRequesterProjects().$promise;
        }
        function listAllPaymentRequestByStatus(query){
            console.log(query,"service");
            return api.getPaymentRequestsByStatus({q: query}).$promise;
        }


    }
}());

