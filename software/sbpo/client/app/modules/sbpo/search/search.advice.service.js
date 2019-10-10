'use strict';
(function () {
    angular
        .module('sbpo.searchAdvice')
            .factory('searchAdviceService', searchAdviceService);
    searchAdviceService.$inject = ['$http','$q','$rootScope','api','paymentAdvice','$cookies','loginService'];
    function searchAdviceService($http, $q, $rootScope,api,paymentAdvice,$cookies,loginService) {

        var service = {
            readAdvices: readAdvices,
            searchByDate:searchByDate,
            getUserById: getUserById,
            getAdviceByStatus:readAdvicesByRole,
            searchByAdviceNumber:searchByAdviceNumber,
            calculateAggregationByProject: aggregationByProject,
            getPayeeByUserId:getPayeeByUserId,
            searchByDateTblTab:searchByDateTblTab,

            model: {
                payee: '',
                fromDate: '',
                toDate:'',
                project:'',
                status:'',
                adviceNum:''
            },

            saveState: function () {
                sessionStorage.searchAdviceService = angular.toJson(service.model);
            },

            restoreState: function () {
                service.model = angular.fromJson(sessionStorage.searchAdviceService);
            },
            getAdviceCount:getAdviceCount,
            getAdviceCountBasedOnSearchCriteria:getAdviceCountBasedOnSearchCriteria

        };
        $rootScope.$on("savestate", service.saveState);
        $rootScope.$on("restorestate", service.restoreState);
        return service;

        /**
         *
         * @param query
         * @returns {*|Function}
         * This method will fetch advices for table view.
         */
        function searchByDateTblTab(query){
            var deferred = $q.defer();
            var query = angular.extend(query);
            return api.searchByDateTblTab({q:query}).$promise;
        }


        function searchByAdviceNumber(query){
            var deferred = $q.defer();
            var query = angular.extend(query);
            return api.searchByAdviceNumber({q:query}).$promise;
        }
        /**
         * this fuction  search advices by date range
         * */
        function searchByDate(query){
            console.log("searchByDate")
            console.log(query)
            console.log("searchByDate")
            var deferred = $q.defer();
            var query = angular.extend(query);
            return api.searchByDate({q:query}).$promise;
        }
        /**
         * this fuction return aggregate of requseted amount by project
         * */
        function aggregationByProject(query) {
            var deferred = $q.defer();
            var query = angular.extend(query);
            return api.aggregateByProject({q:query}).$promise;
        }
        /**
         * this fuction return user by id
         * */
        function getUserById(id) {
            var query = angular.extend(id);
            return api.getUserById({q:query}).$promise;
        }
        //function for read advices from server
        function readAdvices() {
            return api.adviceList().$promise;
        }
        //function for read in advices by role from server
        function readAdvicesByRole(query){
            return api.advicesByRole({q: query}).$promise;
        }

        function getAdviceCount(){
            return api.adviceCount().$promise;
        }

        /**
         * Provides payee details based on payee(user) id
         * @param query
         * @returns {*|Function}
         */
        function getPayeeByUserId(query) {
            return api.getPayeeByUserId(query).$promise;
        }

        function getAdviceCountBasedOnSearchCriteria(query) {
            return api.getAdviceCountBasedOnSearchCriteria({q:query}).$promise;
        }
    }
}());

