(function(){
    angular.module('sbpo.feedback')
        .factory('feedbackService', feedbackService);
    feedbackService.$inject=['$q','api'];
    function  feedbackService($q,api){
        service={
           feedBackMail:feedBackMail
        };
        return service;
        function feedBackMail(query){
            return api.feedbackMail(query).$promise;
        }
    }
}());
