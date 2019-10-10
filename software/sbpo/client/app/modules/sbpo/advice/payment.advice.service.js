/**
 * Created by surendra on 18/10/16.
 */
'use strict';
(function() {
    angular.module('sbpo.advice')
        .factory('paymentAdvice',paymentAdvice);
    paymentAdvice.$inject = ['api', '$q', '$uibModal','$cookies','loginService','passUtilsService','$rootScope','Flash','$filter'];

    function paymentAdvice(api, $q, $uibModal,$cookies,loginService,passUtilsService,$rootScope,Flash,$filter) {
        var paymentAdviceService = {
            saveAdviceRecord : saveAdviceRecord,
            addPayeeRecord : addPayeeRecord,
            saveComment:saveComment,
            getCommentsByAdvice:getCommentsByAdvice,
            commentAdviceModal:commentAdviceModal,
            updateAdvice:updateAdvice,
            viewAdvice:viewAdvice,
            getProjectsByName:getProjectsByName,
            getPayeesByName:getPayeesByName,
            getAllPaymentModes:getAllPaymentModes,
            getAdvicePriority:getAdvicePriority,
            amendDisbursedAdvice:amendDisbursedAdvice,
            prepareEditAdviceQuery:prepareEditAdviceQuery
        };
        return paymentAdviceService;

        function prepareEditAdviceQuery(advice) {
            var query = advice;
            query.payee = query.payee ? query.payee : null;
            query.project = query.project ? query.project : null;
            query.secondLevelApprover = query.secondLevelApprover ? query.secondLevelApprover._id : null;
            query.thirdLevelApprover = query.thirdLevelApprover ? query.thirdLevelApprover._id : null;
            query.disburser = query.disburser ? query.disburser._id : null;
            query.organization = query.organization ? query.organization._id : null;
            query.user = query.user ? query.user._id : null;
            if(query.comments) {
                query.comments = [];
            }
            if(query.category === '') {
                query.category = undefined;
            }
            if(query.paymentType === '') {
                query.paymentType = undefined;
            }
            query.currentUser=$rootScope.getCurrentLoggedInUser()._id;
            return query
        }
        function getAllPaymentModes(){
            return [
                {value: 'Cash', text: 'Cash'},
                {value: 'Cheque', text: 'Cheque'},
                {value: 'RTGS', text: 'RTGS'},
                {value: 'Credit Card', text: 'Credit Card'},
                {value: 'Debit Card', text: 'Debit Card'},
                {value: 'NEFT', text: 'NEFT'},
                {value: 'Debit By Bank', text: "Debit By Bank"}
            ];
        }

        /*Get the advice priority
         * */
        function getAdvicePriority(){
            return [
                {value: true, key: 'Yes'},
                {value: false, key: 'No'}
            ];

        }

        function saveAdviceRecord(paymentAdviceObj){
            // TODO: will be implemented as part of save payment advice story.
            var query=paymentAdviceObj;
            var deferred = $q.defer();
            api.postAdvice({q:query}).$promise.then(insertAdviceSuccessfully).catch(insertAdviceFailed);
            function insertAdviceSuccessfully(response) {
                $rootScope.$broadcast('updateAdviceCount');
                deferred.resolve(response);
            }
            function insertAdviceFailed(error) {
                deferred.reject(error)
            }
            return deferred.promise;
        }
        /**
         * this fuction  updates advice
         * */
        function updateAdvice(advice){
            var query=advice;
            return api.editAdvice({q:query,id:query._id}).$promise;
        }
        function getPayeesByName(query){
            return api.getPayeesByName(query).$promise;
        }
        /*
         * retriveing projects by name
         *
         * */
        function getProjectsByName(query){
            return api.getProjectByName(query).$promise;
        }
        /*
         * this function saves payee record
         *
         * */
        function addPayeeRecord(payee) {
            //todo:add payee details
            var query=payee;
            return api.postPayee({q:query}).$promise;
        }

        function commentAdviceModal(advice,afterSubmitting) {
            var uibModalInstance = $uibModal.open({
                template: require('../../../partials/adviceComments.html'),
                windowClass: 'large-Modal',
                controller: function ($scope,$uibModalInstance,paymentAdvice,$state) {
                    $scope.advice = advice;
                    $scope.closePopup = function () {
                        $uibModalInstance.dismiss('cancel');
                        if(afterSubmitting) {
                            afterSubmitting();
                        }
                    };
                    $scope.getComments=getComments;
                    $scope.getComments();
                    $scope.submitComment=submitComment;
                    function getComments(){
                        var query={
                            adviceId:$scope.advice._id
                        };
                        paymentAdvice.getCommentsByAdvice(query).then(getCommentSuccess).catch(getCommentFailure);
                        function getCommentSuccess(response) {

                            if(response.data.length==0){
                                $scope.comments=null;
                            }else{
                                $scope.comments=response.data;
                                $scope.advice.comments = response.data;
                            }


                        }
                        function getCommentFailure(error){
                            console.log(error);

                        }

                    }
                    function submitComment(adviceId){
                        var currentUser = $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);
                        var query={
                            adviceId:adviceId,
                            text:$scope.text,
                            userId:currentUser._id,
                            date:new Date()
                        };
                        paymentAdvice.saveComment(query).then(saveCommentSuccess).catch(saveCommentFailure)
                        function saveCommentSuccess(response) {
                            console.log("response")
                            console.log(response)
                            console.log("response")
                            if(response.status === "FAILED"){
                                Flash.create('danger', $filter('translate')('advice.comment.required'),'commentFlashMsgDiv');
                            }
                            else if(response.status === "OK"){
                                $scope.getComments();
                                $uibModalInstance.close();
                            }
                        }
                        function saveCommentFailure(error) {
                            console.log(error);
                        }
                        $scope.text = "";
                    }

                    $scope.isEmpty = function (obj) {
                        return passUtilsService.isEmpty(obj);
                    }
                }
            });
        }
        function viewAdvice(id, includeComments) {
            var query={};
            if(includeComments) {
                query.includeComments = includeComments;
            }
            var deferred = $q.defer();
            return api.viewAdvice({q:query, id:id}).$promise;
        }
        /*
         * this function saves comment
         *
         * */
        function saveComment(query){
            return api.postComment({q:query}).$promise;
        }
        /*
         * this function returns comments based on advice id
         *
         * */
        function getCommentsByAdvice(query){
            return api.getCommentsByAdviceId({q:query,id:query.adviceId}).$promise;
        }

        /*
         * this function returns comments based on advice id
         *
         * */
        function amendDisbursedAdvice(advice){
            return api.amendDisbursedAdvice({q:advice}).$promise;
        }

    }

}());
