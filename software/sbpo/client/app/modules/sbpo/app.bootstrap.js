(function() {
    'use strict';

    window.deferredBootstrapper.bootstrap({
        element: window.document,
        module: 'sbpo',
        resolve: {
            STARTUP_CONFIG_RESP: ['$http', function ($http) {
                return $http.get('/getConfig');
            }]
        }
    });

}());
