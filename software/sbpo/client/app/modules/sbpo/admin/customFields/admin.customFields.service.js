/**
 * Created by sukesh on 25/1/17.
 */
(function () {
    angular.module('admin')
        .factory('customFieldService',customFieldService);
    customFieldService.$inject=['api'];

    function customFieldService(api){

        var service={
            saveCustomField:saveCustomField,
            listAllCustomFields : listAllCustomFields,
            deleteCustomField : deleteCustomField,
            editCustomField:editCustomField
        };
        return service;

        /**
         * this fuction saves customField data
         * */
        function saveCustomField(query){
            return  api.submitCustomField({q:query}).$promise;
        }

        /**
         * this fuction gives list of all customFields
         * */
        function listAllCustomFields(query){
            return  api.listCustomFields({type:query}).$promise;
        }
        /**
         * this fuction deletes custom field
         * */
        function deleteCustomField(query){
            return  api.deleteCustomField({id:query}).$promise;
        }
        /**
         * this fuction edit custom field
         * */
        function editCustomField(query){
            return  api.editCustomField({q:query,id:query.id}).$promise;
        }

    }
})();
