'use strict';
(function() {
    var app = angular.module('flash', []);

    app.run(['$rootScope', function($rootScope) {
        // initialize variables
        $rootScope.flash = {};
        $rootScope.flash.text = '';
        $rootScope.flash.type = '';
        $rootScope.flash.timeout = 5000;
        $rootScope.msg = {};
    }]);

    // Directive for compiling dynamic html
    app.directive('dynamic', ['$compile', function($compile) {
        return {
            restrict: 'A',
            replace: true,
            link: function(scope, ele, attrs) {
                scope.$watch(attrs.dynamic, function(html) {
                    ele.html(html);
                    $compile(ele.contents())(scope);
                });
            }
        };
    }]);

    // Directive for closing the flash message
    app.directive('closeFlash', ['$compile', 'Flash', function($compile, Flash) {
        return {
            link: function(scope, ele) {
                ele.on('click', function() {
                    Flash.dismiss();
                });
            }
        };
    }]);

    // Create flashMessage directive
    app.directive('flashMessage', ['$compile', '$rootScope', function($compile, $rootScope) {
        return {
            restrict: 'A',
                template: '<div role="alert" ng-show="msg[id].hasFlash" class=" {{msg[flash.divId].hasFlash}} alert {{flash.addClass}} alert-{{flash.type}} alert-dismissible ng-hide alertIn alertOut "> <span dynamic="flash.text"></span></div>',
            link: function(scope, ele, attrs) {
                // get timeout value from directive attribute and set to flash timeout
                $rootScope.flash.timeout = parseInt(attrs.flashMessage, 10);
                scope.id = ele.attr('id');
                $rootScope.msg[scope.id] = {'hasFlash': false};
            }
        };
    }]);

    app.factory('Flash', ['$rootScope', '$timeout',
        function($rootScope, $timeout) {

            var dataFactory = {},
                timeOut;

            // Create flash message
            dataFactory.create = function(type, text, divId, addClass) {
                var $this = this;
                $timeout.cancel(timeOut);
                $rootScope.flash.type = type;
                $rootScope.flash.text = text;
                $rootScope.flash.addClass = addClass;
                $rootScope.flash.divId = divId;
                console.log($rootScope.msg);
                $timeout(function() {
                    $rootScope.msg[divId].hasFlash = true;
                }, 100);
                timeOut = $timeout(function() {
                    $this.dismiss();
                    $rootScope.msg[divId].hasFlash = false;
                }, $rootScope.flash.timeout);
            };

            // Cancel flashmessage timeout function
            dataFactory.pause = function() {
                $timeout.cancel(timeOut);
            };

            // Dismiss flash message
            dataFactory.dismiss = function() {
                $timeout.cancel(timeOut);
                $timeout(function() {
                    $rootScope.msg[$rootScope.flash.divId].hasFlash = false;
                });
            };
            return dataFactory;
        }
    ]);
}());
