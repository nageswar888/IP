(function(){
    angular.module('admin')
        .controller('adminSettingsController',adminSettingsController);
        adminSettingsController.$inject=['$state', '$rootScope'];

        function adminSettingsController($state, $rootScope){
            var asc=this;
            asc.active = getActiveTab();
            asc.activeTab = getActiveTab;


            function getActiveTab() {
                if($state.current.name === 'admin.settings.virtualledger') {return 0;}
                if($state.current.name === 'admin.settings.notification') {return 1;}
                if($state.current.name === 'admin.settings.category') {return 2;}
                if($state.current.name === 'admin.settings.payment') {return 3;}
                if($state.current.name === 'admin.settings.stamp') {return 4;}
                if($state.current.name === 'admin.settings.ledger') {return 5;}
                return 0;
            }
        }

})();
