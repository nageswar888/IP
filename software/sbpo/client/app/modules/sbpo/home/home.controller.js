'use strict';
(function(){
    angular
        .module('sbpo.home')
        .controller('HomeController', HomeController);

    HomeController.$inject = [ '$state', '$scope', '$rootScope','AclService'];

    function HomeController($state, $scope, $rootScope,AclService){
        $scope.can = AclService.can;
    }
}());
