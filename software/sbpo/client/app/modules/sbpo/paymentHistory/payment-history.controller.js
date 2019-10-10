'use strict';
(function(){
    angular
        .module('sbpo.paymentHistory')
        .controller('paymentHistoryController', paymentHistoryController);

    paymentHistoryController.$inject = ['paymentHistoryService', '$rootScope', 'searchAdviceService', 'NgTableParams', '$filter', '$http', 'passUtilsService', 'adviceStatus', '$state', 'radioButtonValues'];

    function paymentHistoryController(paymentHistoryService, $rootScope, searchAdviceService, NgTableParams, $filter, $http, passUtilsService, adviceStatus, $state, radioButtonValues) {
        var vm = this;
        vm.getPaymentHistory = getPaymentHistory;
        vm.isValidDateRange = false;
        vm.getAllPayees = getAllPayees;
        vm.setDateRangeFalse = setDateRangeFalse;
        vm.advice = { model: {status : adviceStatus.DISBURSED}};
        vm.paymentHistory = [];
        vm.downloadAdvicePdf = downloadAdvicePdf;
        vm.resetPaymentHistory = resetPaymentHistory;
        vm.sinceBeginning = radioButtonValues.BEGINNING;
        vm.setDateNull = setDateNull;
        vm.viewAdviceDetails = viewAdviceDetails;
        getPayeeByUserId();
        function getAllPayees(searchTerm){
            paymentHistoryService.getPayeesByName({payeeName:searchTerm}).then(handleReadPayeesSuccess).catch(handleReadPayeesFailure);
            function handleReadPayeesSuccess(response) {
                if(response.data){
                    vm.payees=response.data;
                    vm.payees.unshift( {nickName:'All'})

                }else{
                    vm.payees=[];
                    vm.payees.push( {nickName:'All'})
                }
            }
            function handleReadPayeesFailure(error){
                console.log(error);
            }
        }
        function setDateRangeFalse(){
            vm.sinceBeginning = null;
            vm.isValidDateRange = false;
        }
        function getPaymentHistory(){
            if(vm.advice.model.fromDate && vm.advice.model.toDate){
                if(new Date(vm.advice.model.fromDate).getTime() > new Date(vm.advice.model.toDate).getTime()){
                    vm.isValidDateRange = true;
                    vm.paymentHistoryForm.$valid=false;
                }else{
                    if(vm.paymentHistoryForm.$valid){
                        var query={
                            payee : vm.advice.model.payee._id,
                            fromDate : vm.advice.model.fromDate,
                            toDate : vm.advice.model.toDate
                        };
                        paymentHistoryService.fetchTotalAmount(query).then(function(response){
                            vm.totalAmount=response.data[0].total;
                        },function(error){
                            console.log("error",error);
                        });

                        loadTableParams();
                    }else{

                    }
                }
            }else{
                if(vm.paymentHistoryForm.$valid){
                    var query={
                        payee : vm.advice.model.payee._id,
                        fromDate : vm.advice.model.fromDate,
                        toDate : vm.advice.model.toDate
                    };
                    paymentHistoryService.fetchTotalAmount(query).then(function(response){
                        vm.totalAmount=response.data[0].total;
                    },function(error){
                        console.log("error",error);
                    });

                    loadTableParams();
                }else{
                    console.log('error');
                }
            }
        }

        function loadTableParams() {
            vm.tableParams = new NgTableParams({
                page: 1,
                count: 10
            },{
                getData: function(params){
                    var query = {
                        page_size: params.count() === -1 ? 0 : params.count(),
                        page:params.page(),
                        payee : vm.advice.model.payee._id,
                        fromDate : vm.advice.model.fromDate,
                        toDate : vm.advice.model.toDate
                    };
                    return paymentHistoryService.getPaymentHistory(query).then(function(response) {
                        vm.noRecordMessage=false;
                        params.total(response.pagination.total);
                        if (response.data.length ===0 ) {
                            vm.noRecordMessage=true;
                        } else {
                            vm.paymentHistory = response.data;
                            var orderedData = params.sorting() ?
                                $filter('orderBy')(response.data, params.orderBy()) : response.data;
                            return orderedData;
                        }
                    }, function(error) {
                        console.error('Error occured while loading data.');
                    });
                }
            });
        }
        function getPayeeByUserId() {
            /*Allowing to execute this function only for payee*/
            if($rootScope.isPayee()) {
                var currentUserId = $rootScope.getCurrentLoggedInUser()['_id'];
                searchAdviceService.getPayeeByUserId({id:currentUserId})
                    .then(function(response){
                        vm.advice.model.payee = response.data;
                    })
                    .catch(function(error){ console.log(error); })
            }
        }
        function downloadAdvicePdf(adviceId){
            $http.get('/api/advices/downloadPdf/'+adviceId, {responseType:'arraybuffer'}).then(function (response) {
                var file = new Blob([response.data], {type: 'application/pdf'});
                var fileURL = URL.createObjectURL(file);
                window.open(fileURL);
            });
        }
        function resetPaymentHistory(){
            $state.reload();
        }
        function setDateNull(){
            vm.advice.model.fromDate = null;
            vm.advice.model.toDate = null;
        }

        function viewAdviceDetails(advice) {
            $state.go('viewAdviceDetail',{id: advice._id, graphQuery: null, filterObj: null, resultsView: null})
        }

    }
}());
