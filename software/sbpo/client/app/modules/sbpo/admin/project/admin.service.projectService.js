/**
 * Created by sb0103 on 8/11/16.
 */

(function(){
    angular.module('admin')
        .factory('projectService',projectService);
    projectService.$inject=['loginService','$q','api'];
    //directive for rendering all progresss advices
    function projectService(loginService,$q,api){

        var service={
            submitProject:submitProject,
            getAllProjects:getAllProjects,
            editProject:editProject,
            deleteProject:deleteProject,
            getTotalProjectCount:getTotalProjectCount,
        };
        return service;
        /**
         * this fuction delete project based on id
         * */
        function deleteProject(query){
           return api.deleteProject({id:query}).$promise;
        }
        /**
         * this fuction  edit project based on id
         * */
        function editProject(query){
            return api.editProject({q:query,id:query.id}).$promise;
        }
        /**
         * this fuction return all project list
         * */
        function getAllProjects(query){
            return api.getProjects(query).$promise;
        }
        /**
         * this function will return total count of project
         * */
        function getTotalProjectCount() {
            return  api.getProjectCount().$promise;
        }
        /**
         * this fuction saves project
         * */
        function submitProject(query){
            return api.submitProject({q:query}).$promise;
        }

    }
})();
