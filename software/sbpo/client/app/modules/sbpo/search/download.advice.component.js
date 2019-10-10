/**
 * Created by sb0103 on 11/1/17.
 */

'use strict';
(function(){
    angular.module('sbpo.searchAdvice').component('downloadAdvice',{
        bindings: {
            graphQuery: '=',
            advice:'=',
            adviceCount:'=',
            downloadLimit:'=',
            downloadAllPerProject:'&',
            downloadAsMatrix: '&'
        },
        template: require('../../../partials/downloadAdvice.html'),
        controller:DownloadAdviceController,
        controllerAs:'dac'
    });
    DownloadAdviceController.$inject=['$rootScope','passUtilsService','ledgerType','$uibModal','downloadConstants'];
    function DownloadAdviceController($rootScope,passUtilsService,ledgerType,$uibModal,downloadConstants){
        var dac=this;
        dac.downloadAll=downloadAll;
        dac.allProject=allProject;
        dac.downloadAsProjectMatrix=downloadAsProjectMatrix;

        /**
         *
         */
        function downloadAsProjectMatrix(type) {
            dac.downloadAsMatrix({type:type})
        }

        function allProject(type){
            dac.downloadAllPerProject({type:type});
        }

        function downloadAll(type) {
            var selectedGraphQuery = dac.graphQuery;
            var fromDate = selectedGraphQuery ? selectedGraphQuery.dateQuery.fromDate : dac.advice.model.fromDate;
            var toDate = selectedGraphQuery ? selectedGraphQuery.dateQuery.toDate : dac.advice.model.toDate;
            var adviceNum = selectedGraphQuery ? selectedGraphQuery.dateQuery.adviceNum : dac.advice.model.adviceNum;
            var paymentType = selectedGraphQuery ? selectedGraphQuery.dateQuery.paymentType : dac.advice.model.paymentType?dac.advice.model.paymentType._id:undefined;
            var category = selectedGraphQuery ? selectedGraphQuery.dateQuery.category : dac.advice.model.category?dac.advice.model.category._id:undefined;
            var ledger = selectedGraphQuery ? selectedGraphQuery.dateQuery.ledger : dac.advice.model.ledger?dac.advice.model.ledger._id:undefined;
            var virtualLedger=selectedGraphQuery ? selectedGraphQuery.dateQuery.virtualLedger : dac.advice.model.virtualLedger?dac.advice.model.virtualLedger._id:undefined;

            if(fromDate  && toDate) {
                //if fromDate and toDate is not dd-MMM-yyyy format modify the date format
                if(fromDate.indexOf('/') !== -1 && toDate.indexOf('/') !== -1) {
                    fromDate = moment(fromDate).format($rootScope.dateFormate);
                    toDate = moment(toDate).format($rootScope.dateFormate);
                }
            }
          else if(fromDate) {
                //if fromDate and toDate is not dd-MMM-yyyy format modify the date format
                if(fromDate.indexOf('/') !== -1) {
                    fromDate = moment(fromDate).format($rootScope.dateFormate);
                }
            } else if(toDate) {
                //if fromDate and toDate is not dd-MMM-yyyy format modify the date format
                if(toDate.indexOf('/') !== -1) {
                    toDate = moment(toDate).format($rootScope.dateFormate);
                }
            }

            var payeeName, paymentType, category,categoryName,paymentTypeName,virtualLedgerName,ledgerName;
            if(dac.advice.model.payee) {
                payeeName = passUtilsService.getUserFullName(dac.advice.model.payee.user);
            }
            if(dac.advice.model.paymentType) {
                paymentType = dac.advice.model.paymentType._id;
                paymentTypeName=dac.advice.model.paymentType.name;

            }
            if(dac.advice.model.category) {
                category = dac.advice.model.category._id;
                categoryName = dac.advice.model.category.name;
            }
            if(dac.advice.model.ledger){
                ledger=dac.advice.model.ledger._id;
                ledgerName=dac.advice.model.ledger.name;
            }
            if(dac.advice.model.virtualLedger){
                virtualLedger=dac.advice.model.virtualLedger._id;
                virtualLedgerName=dac.advice.model.virtualLedger.name;
            }
            var query = {
                fromDate:fromDate,
                toDate:toDate,
                payee: dac.advice.model.payee?dac.advice.model.payee._id:undefined,
                project:dac.advice.model.project?dac.advice.model.project._id:undefined,
                status:dac.advice.model.status === "All"?undefined:dac.advice.model.status,
                bankId:dac.advice.model.bank?dac.advice.model.bank._id:undefined,
                payeeName: dac.advice.model.payee?passUtilsService.replaceSpecialCharacters(dac.advice.model.payee.nickName):undefined,
                projectName:dac.advice.model.project?passUtilsService.replaceSpecialCharacters(dac.advice.model.project.projectName):undefined,
                bankName:dac.advice.model.bank?passUtilsService.replaceSpecialCharacters(dac.advice.model.bank.accountName):undefined,
                adviceNum:adviceNum,
                paymentType:paymentType,
                category:category,
                paymentTypeName:passUtilsService.replaceSpecialCharacters(paymentTypeName),
                categoryName:passUtilsService.replaceSpecialCharacters(categoryName),
                fromAmount:dac.advice.model.fromAmount,
                toAmount:dac.advice.model.toAmount,
                virtualLedgerName:passUtilsService.replaceSpecialCharacters(virtualLedgerName),
                ledgerName:passUtilsService.replaceSpecialCharacters(ledgerName)
            };
            if(paymentType) { query["paymentType"] = paymentType}
            if(category) { query["category"] = category}
            if(ledger) { query["ledger"] = ledger}
            if(virtualLedger) { query["virtualLedger"] = virtualLedger}
            if(type===downloadConstants.PDF){
                query.type=downloadConstants.PDF;
                if(dac.adviceCount > dac.downloadLimit) {
                    $uibModal.open({
                        template: require('../../../partials/downloadConfirmation.html'),
                        controller:function UIModalController($scope,$uibModalInstance,Flash){
                            $scope.adviceCount = dac.adviceCount;
                            $scope.maxAdvicesDownload = dac.downloadLimit;
                            $scope.downloadAll=function(){
                                window.open('/api/advices/downloadAll?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
                                $uibModalInstance.close();
                            };
                            $scope.closePopup=function(){
                                $uibModalInstance.close();
                            }
                        }
                    });
                }
                else {
                    window.open('/api/advices/downloadAll?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
                }
            }
            else {
                query.type="excel";
                window.open('/api/advices/downloadAll?auth-token=' + $rootScope.getCurrentLoggedInUser().authToken + '&q=' + JSON.stringify(query));
            }
        }

    }
}());

