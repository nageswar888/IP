(function () {
    angular.module('admin')
        .factory('uploadService',uploadService);
    uploadService.$inject=['api'];

    function uploadService(api){

        var service={
            uploadStamp:uploadStamp,
            uploadLogo:uploadLogo
        };
        return service;

        /**
         * this fuction uploads company stamp
         * */
        function uploadStamp(query){
            return  api.uploadStamp({q:query}).$promise;
        }

        /**
         * this fuction uploads company logo
         * */
        function uploadLogo(query){
            return  api.uploadLogo({q:query}).$promise;
        }


    }
})();

