(function() {
    'use strict';
    angular
        .module('sbpo')
        .config(appConfig);

    appConfig.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', '$translateProvider','$httpProvider','$compileProvider','$qProvider'];

    function appConfig($stateProvider, $urlRouterProvider, $locationProvider, $translateProvider, $httpProvider, $compileProvider,$qProvider) {
        // use the HTML5 History API

        $qProvider.errorOnUnhandledRejections(false);
        $locationProvider.html5Mode(true);
        $stateProvider
            .state('login', {
                url:'/login',
                template: require('../../partials/login.html'),
                controller: 'LoginController',
                controllerAs: 'lc'
            })
            .state('home', {
                url:'/home',
                template: require('../../partials/home.html'),
                controller: 'HomeController',
                controllerAs: 'hc'
            })
            .state('advice', {
                url:'/advice',
                template: require('../../partials/adviceHome.html'),
                controller: 'SearchAdviceController',
                controllerAs: 'sac'
            })
            .state('admin', {
                url:'/admin',
                template: require('../../partials/adminHome.html'),
                controller: 'adminController',
                controllerAs: 'ahc',
                resolve : {
                    'acl' : ['$q', 'AclService', function($q, AclService){
                            if(AclService.can('ADMIN')){
                                // Has proper permissions
                                return true;
                            } else {
                                // Does not have permission
                            return $q.reject('Unauthorized');
                        }
                    }]
                }
            })
            .state('admin.project', {
                url:'/project/new',
                template: require('../../partials/addProject.html'),
                controller: 'addProjectController',
                controllerAs: 'apc'
            })

            .state('admin.bank', {
                url:'/account/new',
                template: require('../../partials/addBank.html'),
                controller: 'addbankController',
                controllerAs: 'abc'
            })

            .state('admin.banktbl', {
                url:'/account/list',
                template: require('../../partials/bankTable.html'),
                controller: 'addbankController',
                controllerAs: 'abc'
            })

            .state('admin.projecttbl', {
                url:'/project/list',
                template: require('../../partials/projectTbl.html'),
                controller: 'addProjectController',
                controllerAs: 'apc'
            })
            .state('admin.payee', {
                url:'/payee/new',
                template: require('../../partials/addAdminPayee.html'),
                controller: 'addAdminPayeeController',
                controllerAs: 'aapc'
            })
            .state('admin.payeetbl', {
                url:'/payee/list',
                template: require('../../partials/payeeTable.html'),
                controller: 'addAdminPayeeController',
                controllerAs: 'aapc'
            })
            .state('admin.user', {
                url:'/user/new',
                template: require('../../partials/addUser.html'),
                controller: 'addUserController',
                controllerAs: 'auc'
            })

            .state('admin.userTable', {
                url:'/user/list',
                template: require('../../partials/userTable.html'),
                controller: 'addUserController',
                controllerAs: 'auc'
            })

            .state('profile', {
                url:'/profile',
                template: require('../../partials/profile.html'),
                controller: 'ProfileController',
                controllerAs: 'apc'
            })
            .state('paymentRequest', {
                url:'/paymentRequest/list',
                template: require('../../partials/paymentRequests/paymentRequest.html'),
                controller: 'PaymentRequestController',
                controllerAs: 'prc',
                params:{
                    status:"PaymentRequests",
                    message:null
                }

            })
            .state('advice.inprogress', {
                url:'/inprogress',
                template: require('../../partials/inprogressAdvices.html'),
                controller: 'progressAdviceController',
                controllerAs: 'pac',
                params:{
                    status:"Inprogress",
                    message:null
                }
            })
            .state('inprogressPaymentRequests',{
                url:'/unprocessed',
                template: require('../../partials/inprogressPaymentRequests.html'),
                controller: 'progressPaymentRequestController',
                controllerAs: 'pprc',
                params:{
                    status:"SUBMITTED",
                    message:null
                }
            })
            .state('inProcessPaymentRequests',{
                url:'/processed',
                template: require('../../partials/inprocessPaymentRequests.html'),
                controller: 'progressPaymentRequestController',
                controllerAs: 'pprc',
                params:{
                    status:"APPROVED",
                    message:null
                }
            })
            .state('rejectedPaymentRequests',{
                url:'/rejected',
                template: require('../../partials/rejectedPaymentRequests.html'),
                controller: 'progressPaymentRequestController',
                controllerAs: 'pprc',
                params:{
                    status:"REJECTED",
                    message:null
                }
            })
            .state('advice.pending-approval', {
                url:'/pending-approval',
                template: require('../../partials/pendingAdvices.html'),
                controller: 'progressAdviceController',
                controllerAs: 'pac',
                params:{
                    status:"Pending",
                    message:null
                },
                resolve : {
                    'acl': ['$q', 'AclService', function ($q, AclService) {
                        if (AclService.can('PENDING_APPROVAL')) {
                            // Has proper permissions
                            return true;
                        } else {
                            // Does not have permission
                            return $q.reject('Unauthorized');
                        }
                    }]
                }
            })
            .state('advice.rejected', {
                url:'/rejected',
                template: require('../../partials/rejectedAdvices.html'),
                controller: 'progressAdviceController',
                controllerAs: 'pac',
                params:{
                    status:"Rejected",
                    message:null
                }
            })
            .state('logout', {
                url:'/logout',
                template: require('../../partials/login.html'),
                controller: 'LoginController',
                controllerAs: 'lc'
            })
            .state('createAdvice', {
                url:'/advice/new',
                params: {
                    advice: null,
                    prObj: undefined
                },
                template: require('../../partials/createAdvice.html'),
                controller: 'PaymentAdviceController',
                controllerAs: 'pa',
                resolve : {
                    'acl': ['$q', 'AclService', function ($q, AclService) {
                        if (AclService.can('CREATE_ADVICE')) {
                            // Has proper permissions
                            return true;
                        } else {
                            // Does not have permission
                            return $q.reject('Unauthorized');
                        }
                    }]
                }
            })
            .state('createLegacyAdvice', {
                url:'/advice/legacy',
                params: {advice: null},
                template: require('../../partials/createAdvice.html'),
                controller: 'PaymentAdviceController',
                controllerAs: 'pa',
                resolve : {
                    'acl': ['$q', 'AclService', function ($q, AclService) {
                        if (AclService.can('CREATE_LEGACY')) {
                            // Has proper permissions
                            return true;
                        } else {
                            // Does not have permission
                            return $q.reject('Unauthorized');
                        }
                    }]
                }
            })
            .state('searchAdvice', {
                url: '/advice/search',
                params: {
                    graphQuery: undefined,
                    filterObj: undefined,
                    resultsView: undefined
                },
                template: require('../../partials/searchAdvice.html'),
                controller: 'SearchAdviceController',
                controllerAs: 'sac'
            })
            .state('zingChart', {
                template: require('../../partials/zingChartHtml.html'),
                controller: 'zingController',
                controllerAs: 'zing'
            })
            .state('unauthorized', {
                template: require('../../partials/unauthorized.html'),
                controller: 'unauthorizedController',
                controllerAs: 'auc'
            })
            .state('forgotPassword', {
                url: '/forgotPassword',
                template: require('../../partials/forgotPassword.html'),
                controller: 'forgotPasswordController',
                controllerAs: 'fpc'
            })
            .state('resetPassword', {
                url: '/resetPassword',
                template: require('../../partials/resetPassword.html'),
                controller: 'resetPasswordController',
                controllerAs: 'rpc'
            })
            .state('feedback', {
                url: '/feedback',
                template: require('../../partials/feedBack.html'),
                controller: 'feedbackController',
                controllerAs: 'fc'
            })
            .state('viewAdviceDetail', {
                url: '/advice/list/:id',
                    template: require('../../partials/viewAdvice.html'),
                controller: 'viewAdviceCtrl',
                controllerAs: 'pa',
                params:{
                    'adviceobject':{},
                    graphQuery: undefined,
                    filterObj: undefined,
                    resultsView: undefined,
                    showValidation: undefined,
                    editType: undefined,
                    message:null
                }
            })
            .state('organizations', {
                url: '/organizations',
                template: require('../../partials/organizations/organizations.html'),
                controller: 'organizationController',
                controllerAs: 'oc'
            })
            .state('neworgnaization', {
                url:'/organization/new',
                template: require('../../partials/organizations/addorg.html'),
                controller: 'addOrgController',
                controllerAs: 'aoc'
            }).state('admin.settings', {
                url:'/settings',
                template: require('../../partials/admin-settings.html'),
                controller: 'adminSettingsController',
                controllerAs: 'asc'
            }).state('admin.settings.virtualledger', {
                url:'/virtual-ledger',
                template: require('../../partials/virtual-ledger/virtual-ledger.html'),
                controller: 'virtualLedgerController',
                controllerAs: 'vlc'
            }).state('admin.settings.ledger', {
                url:'/ledger',
                template: require('../../partials/ledger/ledger.html'),
                controller: 'ledgerController',
                controllerAs: 'lc'
            }).state('admin.settings.notification', {
                url:'/notification',
                template: require('../../partials/notification/notificationForm.html'),
                controller: 'notificationController',
                controllerAs: 'anc'
            }).state('admin.settings.category', {
                url:'/categories',
                template: require('../../partials/category/categories.html'),
                controller: 'categoriesController',
                controllerAs: 'cc'
            }).state('admin.settings.payment', {
                url:'/payment-types',
                template: require('../../partials/paymenttype/paymentTypes.html'),
                controller: 'paymentTypeController',
                controllerAs: 'ptc'
            }).state('admin.settings.stamp', {
                url:'/upload',
                template: require('../../partials/upload/uploadImage.html'),
                controller: 'uploadController',
                controllerAs: 'cfc'
            }).state('newPaymentRequest', {
                url:'/paymentRequest/new',
                template: require('../../partials/paymentRequests/addPaymentRequest.html'),
                controller: 'addPaymentRequestController',
                controllerAs: 'aprc'
            }).state('paymentHistory', {
            url:'/paymentHistory',
            templateUrl: 'app/partials/paymentHistory/paymentHistory.html',
            controller: 'paymentHistoryController',
            controllerAs: 'phc',
            resolve : {
                'acl' : ['$q', 'AclService', function($q, AclService){
                    if(AclService.can('VIEW_PAYMENT_HISTORY')){
                        // Has proper permissions
                        return true;
                    } else {
                        // Does not have permission
                        return $q.reject('Unauthorized');
                    }
                }]
            }
        })
            .state('payeeTable', {
                url:'/payee/list',
                template: require('../../partials/payeeTable.html'),
                controller: 'addAdminPayeeController',
                controllerAs: 'aapc'
            })

        console.log("djfhsdjfc nhjbgvhjbjn")
        $urlRouterProvider.otherwise('/login');
        $translateProvider.useStaticFilesLoader({
            prefix: 'app/i18n/messages-',
            suffix:'.json'
        });
        $translateProvider.preferredLanguage('en');
        $translateProvider.forceAsyncReload(true);
       // $compileProvider.preAssignBindingsEnabled(true);
        //getting auth token logic
        $httpProvider.interceptors.push(function($q, $cookies, $rootScope) {
            return {
                'request': function(config) {
                    if ($rootScope.getCurrentLoggedInUser()) {
                        config.headers['Auth-token'] = $rootScope.getCurrentLoggedInUser().authToken;
                    }
                    return config;
                },
                responseError: function (response) {
                    if(response.status===404 && response.data.message==="Token not found"){
                        $cookies.remove($rootScope.STARTUP_CONFIG.currUserCookieName);
                        $rootScope.$broadcast('unauthorized');
                    }

                    if(response.status===403 && response.data.message==="User account blocked"){
                        $rootScope.$broadcast('blocked');
                    }
                    return $q.reject(response);
                }
            };
        });
        //to enable bindings
        //$compileProvider.preAssignBindingsEnabled(true);
    }
}());
