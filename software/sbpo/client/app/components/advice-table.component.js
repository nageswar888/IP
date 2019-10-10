'use strict';
(function(){
    angular.module('sbpo').component('adviceTable',{
        bindings: {
            tableParams: '=',
            hideColumns:'=',
            viewAdviceDetails:'&',
            downloadAdvicePdf:'&'
        },
        template: require('../partials/adviceTableContent.html'),
        controller:AdviceTableController,
        controllerAs:'atc'
    });
    AdviceTableController.$inject=['$http'];

    function  AdviceTableController( $http ){
        var vm=this;
        vm.downloadAdvicePdf = downloadAdvicePdf;

        function downloadAdvicePdf(adviceId) {
            $http.get('/api/advices/downloadPdf/'+adviceId, {responseType:'arraybuffer'}).then(function (response) {
                var file = new Blob([response.data], {type: 'application/pdf'});
                var fileURL = URL.createObjectURL(file);
                window.open(fileURL);
            });
        }

    }
}());
