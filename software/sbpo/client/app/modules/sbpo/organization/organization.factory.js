'use strict';
(function () {
    angular
        .module('sbpo.organization')
        .factory('organizationService', organizationService);
    organizationService.$inject = ['api','$q'];

    function organizationService(api, $q) {
        var service = {
            getOrganizations : getOrganizations,
            saveOrganization : saveOrganization,
            updateOrganization : updateOrganization,
            getOrganizationById : getOrganizationById,
            deleteStamps:deleteStamps
        };
        return service;

        function deleteStamps(query){
            return api.deleteStamps({q:query}).$promise;
        }

        function getOrganizations(query) {
            return api.getOrganizations({q:query}).$promise;
        }

        function saveOrganization(query) {
            return api.saveOrg({q: query}).$promise;
        }

        function updateOrganization(query) {
            return api.updateOrg({q:query}).$promise;
        }

        function getOrganizationById(query){
            return api.getOrganizationById({id:query}).$promise;
        }
    }
}());
