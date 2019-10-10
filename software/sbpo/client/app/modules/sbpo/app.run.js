(function() {
    'use strict';
    angular
        .module('sbpo')
        .run(function(editableOptions) {
            editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        })
        .run(appRun);
    appRun.$inject = [
        '$rootScope', '$state', '$cookies', 'AclService', 'searchAdviceService', 'loginService','$window',
        '$timeout', 'passUtilsService', 'STARTUP_CONFIG_RESP', 'organizationService', 'paymentRequestService', 'states'
    ];

    function appRun($rootScope, $state, $cookies, AclService, searchAdviceService, loginService, $window, $timeout,
                    passUtilsService, STARTUP_CONFIG_RESP, organizationService, paymentRequestService, states) {
        $rootScope.STARTUP_CONFIG = STARTUP_CONFIG_RESP.data;
        $rootScope.$state = $state;
        $rootScope.dateFormate = "DD-MMM-YYYY";
        $rootScope.currentState='criteria';

        var statesArray=['login','logout','forgotPassword','resetPassword'];

        /*To place the current logged in user on rootScope*/
        $rootScope.getCurrentLoggedInUser = function(){
            var currentUser =  $cookies.getObject($rootScope.STARTUP_CONFIG.currUserCookieName);
            if(currentUser!==undefined){
                return currentUser;
            }
            return undefined;
        };

        $rootScope.getpaymentModes=getpaymentModes;
        $rootScope.adviceStatusForSearch=['Disbursed'];
        $rootScope.keyCode=[37,38,39,40,191];
        $rootScope.backToHomePage = backToHomePage;
        $rootScope.getMultiRoles=getMultiRoles;
        $rootScope.totalAviceStatus=['Submitted','Level 2 Approved','Level 3 Approved','Disburser Approved','Disbursed'];
        $rootScope.adviceStatusWithOutSubmitted=['Level 2 Approved','Level 3 Approved','Disburser Approved','Disbursed'];
        $rootScope.adviceStatusWithOUtSubmittedLevel2=['Level 3 Approved','Disburser Approved','Disbursed'];
        $rootScope.adviceStatusDisburserApprovedDisbursed=['Disburser Approved','Disbursed'];
        $rootScope.adviceStatusDisbursed=['Disbursed'];
        $rootScope.adviceStatuswithOutDisbursed=['Submitted','Level 2 Approved','Level 3 Approved','Disburser Approved'];
        $rootScope.adviceStatusOnRole={initiatorRole:['Draft'],level2ApproverRole:['Submitted'],level3ApproverRole:['Level 2 Approved'],disbursedRole:['Level 3 Approved','Disburser Approved']};
        $rootScope.accountType=['Bank Account','Cash on Hand','Credit Card','Debit Card'];
        $rootScope.allRoles = ['ROLE_INITIATOR','ROLE_LEVEL3APPROVER','ROLE_LEVEL2APPROVER','ROLE_DISBURSER','ROLE_MASTERADMIN','LEGACY_DATA_OPERATOR','ROLE_VIEWER', 'ROLE_IPASS_MASTERADMIN', 'ROLE_PAYEE', 'ROLE_PAYMENT_REQUESTER'];
        $rootScope.allAdviceStatus = ['Draft','Submitted','Level 2 Approved','Level 3 Approved','Disburser Approved','Disbursed'];
        $rootScope.adviceEditType = ['viewAdvice','disbursedAdminEdit','editAdvice'];
        function getpaymentModes() {
            return ['Cash','Cheque','RTGS','Credit Card','Debit Card','NEFT','Debit By Bank']
        }
        $rootScope.Model=[{id: "payee"},{id: "RequestedAmount"},{id: "Status"},{id: "Project"},{id: "Advice"}];
        $rootScope.monthNames=["Jan","Feb","March","April","May","Jun","July","August","Sept","Oct","Nov","Dec"];

        $rootScope.tableColumns=[
            {label:"Payee",id: "payee",category:'D'},{label:"Requested amount",id: "RequestedAmount",category:'D'},
            {label:"Status",id: "Status",category:'D'},{label:"Project",id: "Project",category:'D'},{label:"Advice",id: "Advice",category:'D'},
            {label:"Requested date",id: "RequestedDate",category:'E'},{label:"Requested by",id:"RequestedBy",category:'E'},
            {label:"Initiated by",id:"InitiatedBy",category:'E'},{label:"First level approver",id:"FirstLevelApprover",category:'E'},
            {label:"Second level approver",id:"secondLevelApprover",category:'E'},{label:"disburser",id:"Disburser",category:'E'},
            {label:"Payment type",id:"PaymentType",category:'E'},{label:"Bill amount due",id:"BillAmountDue",category:'E'},
            {label:"Mode of payment",id:"ModeofPayment",category:'E'},{label:"Date money disbursed",id:"DateMoneyDisbursed",category:'E'},
            {label:"Payment advice number",id:"PaymentAdviceNumber",category:'E'}
        ];

        $rootScope.roleNames = [
            {key:'ROLE_INITIATOR', label:"Initiator"},{key:'ROLE_LEVEL2APPROVER', label:"Level 2 Approver"},
            {key:'ROLE_LEVEL3APPROVER', label:"Level 3 Approver"},{key:'ROLE_VIEWER', label:"Viewer"},
            {key:'ROLE_PAYEE', label:"Payee"},{key:'ROLE_DISBURSER', label:"Disburser"},
            {key:'ROLE_MASTERADMIN', label:"Admin"},{key:'LEGACY_DATA_OPERATOR', label:"Legacy Operator"},
            {key:'ROLE_IPASS_MASTERADMIN', label:"Ipass Admin"},{key:'ROLE_PAYMENT_REQUESTER', label:"Payment Requester"}
        ];

        $rootScope.groupByTypes = ['project', 'payee', 'paymentType', 'category'];

        function backToHomePage(){
            if(AclService.hasRole('ROLE_IPASS_MASTERADMIN')){
                $state.go('organizations');
            }else if ( AclService.hasRole('ROLE_MASTERADMIN')) {
                $state.go('advice.inprogress', {status: 'Inprogress'});
            } else if (AclService.hasRole('ROLE_INITIATOR')) {
                $state.go('createAdvice');
            } else if ( AclService.hasRole('LEGACY_DATA_OPERATOR') ) {
                $state.go('createLegacyAdvice');
            } else if ( AclService.hasRole('ROLE_VIEWER') ) {
                $state.go('advice.inprogress', {status: 'Inprogress'});
            } else if ( AclService.hasRole('ROLE_PAYEE') ) {
                $state.go('paymentHistory');
            } else if ( AclService.hasRole('ROLE_PAYMENT_REQUESTER') ) {
                $state.go('inprogressPaymentRequests',{status:'SUBMITTED'});
            } else{
                $state.go('advice.pending-approval',{status:'Pending'});
            }
        }
        function getMultiRoles(){
            var userRoles = [];
            var currentUser = $rootScope.getCurrentLoggedInUser();
            if(currentUser) {
                angular.forEach(currentUser.roles,function(eachRole){
                    if($rootScope.allRoles.indexOf(eachRole) > -1){
                        userRoles.push(eachRole);
                    }
                });
            }
            return userRoles;
        }
        $rootScope.isAuthenticated = function() {
            var isAuthenticated =  false;
            var currentUser =  $rootScope.getCurrentLoggedInUser();
            if(currentUser) {
                // Attach the member role to the current user
                angular.forEach(currentUser.roles, function (role) {
                    AclService.attachRole(role);
                });
                return !!currentUser.authenticated;
            }
            return isAuthenticated;
        };
        $rootScope.isMasterAdmin = function() {
            return AclService.hasRole('ROLE_MASTERADMIN');
        };

        $rootScope.isIpassMasterAdmin = function() {
            return AclService.hasRole('ROLE_IPASS_MASTERADMIN');
        };

        $rootScope.isLevel2ApproverRole = function() {
            return AclService.hasRole('ROLE_LEVEL2APPROVER');
        };

        $rootScope.isDesRole = function() {
            return AclService.hasRole('ROLE_DISBURSER');
        };

        $rootScope.isLevel3ApproverRole = function() {
            return AclService.hasRole('ROLE_LEVEL3APPROVER');
        };

        $rootScope.isInitiatorRole = function () {
            return AclService.hasRole('ROLE_INITIATOR');
        };

        $rootScope.isInitiator = function() {
            return AclService.hasAnyRole(['ROLE_INITIATOR']);
        }

        $rootScope.isLegacyRole = function () {
            return AclService.hasRole('LEGACY_DATA_OPERATOR');
        };

        $rootScope.isMasterAdminRole = function() {
            return AclService.hasRole('ROLE_MASTERADMIN');
        }

        $rootScope.canAmendOrReject = function () {
            return AclService.hasAnyRole(['ROLE_INITIATOR', 'ROLE_LEVEL2APPROVER',
                'ROLE_LEVEL3APPROVER', 'ROLE_DISBURSER']);
        };

        $rootScope.canComment = function () {
            return AclService.hasAnyRole(['ROLE_INITIATOR', 'ROLE_LEVEL2APPROVER',
                'ROLE_LEVEL3APPROVER', 'ROLE_DISBURSER']);
        };
        $rootScope.loggedInUserName = function () {
            var loggedInUser=$rootScope.getCurrentLoggedInUser();
            return loggedInUser.firstName+" "+loggedInUser.lastName;
        };
        $rootScope.isPayee = function() {
            return AclService.hasRole('ROLE_PAYEE');
        };

        $rootScope.isPaymentRequester = function() {
            return AclService.hasRole('ROLE_PAYMENT_REQUESTER');
        };


        $rootScope.canShowHeader = function() {
            var showHeader = true;
            var states = ['organizations', 'neworgnaization', 'profile', 'feedback' ];
            if( this.isAuthenticated() && (states.indexOf($state.current.name)>=0 || $state.current.name.indexOf('admin.') === 0)) {
                showHeader = false;
            }
            return showHeader;
        };

        $rootScope.signout = function () {
            /*$cookies.remove($rootScope.STARTUP_CONFIG.currUserCookieName);*/
            if(AclService.getRoles().length > 0 ) {
                angular.forEach(AclService.getRoles(),function(eachRole){
                    AclService.detachRole(eachRole);
                });
            }

            loginService.logout().then(logoutSuccess).catch(logoutFailure);

            function logoutSuccess(response){
                console.log(response);
                $cookies.remove($rootScope.STARTUP_CONFIG.currUserCookieName);
                $rootScope.logedIn = false;
                AclService.flushRoles();
                $state.go('login');
            }

            function logoutFailure(error){
                console.log(error);
            }


        };
        //function for changing active and deactive buttons arter state changing.
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
            if ( $rootScope.isAuthenticated() && (statesArray.includes(toState.name)) ) {
                if($rootScope.isInitiatorRole()){
                    $state.go('createAdvice');
                }else if($rootScope.isMasterAdminRole()){
                    $state.go('admin.userTable');
                }else if($rootScope.isLegacyRole()){
                    $state.go('createLegacyAdvice');
                }else if($rootScope.isPaymentRequester() && !$rootScope.isLevel2ApproverRole() && !$rootScope.isLevel3ApproverRole() && !$rootScope.isDesRole()){
                    $state.go('inprogressPaymentRequests');
                }else if($rootScope.isPayee()){
                    $state.go('paymentHistory');
                }else{
                    var obj={
                        status:'Pending'
                    };
                    $state.go('advice.pending-approval',obj);
                }
            } else if ((toState.name !== 'forgotPassword' && toState.name !== 'resetPassword') && ($rootScope.isAuthenticated() === false  && (toState.name !== 'login' || toState.name !== 'logout'))) {
                $cookies.remove($rootScope.STARTUP_CONFIG.currUserCookieName);
                $state.go('login');
            }
            //calling $broadcast on state change success event
            $rootScope.$broadcast('searchGroupByViewEvent')
            $rootScope.previousState = fromState
        });

        $rootScope.$on("$routeChangeStart", function (event, next, current) {
            if (sessionStorage.restorestate == "true") {
                $rootScope.$broadcast('restorestate'); //let everything know we need to restore state
                sessionStorage.restorestate = false;
            }
        });

        //let everthing know that we need to save state now.
        window.onbeforeunload = function (event) {
            $rootScope.$broadcast('savestate');
        };

        $rootScope.backToPriviousPage = function(){
            if($rootScope.previousState.name === 'advice.pending-approval') {
                $state.go($rootScope.previousState.name ,{status:'Pending'});
            }else {
                $window.history.back();
            }
        };

        /*It's count the advices*/
        $rootScope.$on('updateAdviceCount', function () {
            searchAdviceService.getAdviceCount().then(getAdviceCountSuccess).catch(getAdviceCountFailure);
            function getAdviceCountSuccess(response) {
                $rootScope.totalInprogressCount=response.data.inProgressAdviceCount;
                $rootScope.pendingCount=response.data.pendingAdviceCount;
                $rootScope.rejectedCount=response.data.rejectedAdviceCount;
            }
            function getAdviceCountFailure(error){
                console.log(error);
            }
        });

        $rootScope.enableDisableDownloadButton = function() {
            if($state.current.name === states.ADVICE_PENDING) {
                return ($rootScope.pendingCount === 0)
            }
            else if($state.current.name === states.ADVICE_INPROGRESS) {
                return ($rootScope.totalInprogressCount === 0)
            }
            else if($state.current.name === states.ADVICE_REJECTED) {
                return ($rootScope.rejectedCount === 0)
            }
            else if($state.current.name === states.PAYMENT_REQ_INPROGRESS ) {
                return ($rootScope.submittedPaymentReqCount === 0)
            }
            else if($state.current.name === states.PAYMENT_REQ_INPROCESS) {
                return ($rootScope.approvedPaymentReqCount === 0)
            }
            else if($state.current.name === states.PAYMENT_REQ_REJECTED) {
                return ($rootScope.rejectedPaymentReqCount === 0)
            }
        };

        $rootScope.$on('unauthorized', function () {
            $state.go('login');
        });

        $rootScope.$on('blocked', function () {
            $state.go('unauthorized');
        });
        $rootScope.$on('getOrganizationLogo', function () {
            $timeout(function(){
                if($rootScope.getCurrentLoggedInUser()!=undefined){
                    var user=$rootScope.getCurrentLoggedInUser();
                    organizationService.getOrganizationById(user.org).then(gettingOrganizationSuccess).catch(gettingOrganizationFailure);
                }
                function gettingOrganizationSuccess(response){
                    $rootScope.logo=response.data.logo;
                    $rootScope.stamp=response.data.stamp;

                }
                function gettingOrganizationFailure(error){
                    console.log(error);
                }
            },100)

        });

        $rootScope.$on('updatePaymentReqCount', function (event, args) {
            paymentRequestService.getPaymentRequestCount(args).then(handleGetPaymentRequestCountSuccess).catch(handleGetPaymentRequestCountFailure);
            function handleGetPaymentRequestCountSuccess(response) {
                $rootScope.approvedPaymentReqCount=response.data.approvedPaymentReqCount;
                $rootScope.rejectedPaymentReqCount=response.data.rejectedPaymentReqCount;
                $rootScope.submittedPaymentReqCount=response.data.submittedPaymentReqCount;
                $rootScope.totalPaymentReqCount=response.data.totalPaymentReqCount;
            }
            function handleGetPaymentRequestCountFailure(error){
                console.log(error);
            }
        });

        /*client side acl*/
        $rootScope.$on('setAclPrivileges',function(event,iResult){
            AclService.setAbilities(iResult);

            angular.forEach($rootScope.getCurrentLoggedInUser().roles, function (role) {
                AclService.attachRole(role);
            });
        });

        var aclPrivilegesData=JSON.parse(localStorage.getItem('aclDataContant'));
        $rootScope.$broadcast('setAclPrivileges',aclPrivilegesData);

        $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
            if (error && !error.authenticated) {
                $state.go("unauthorized");
            }
        });
        /*clien side acl*/

        $rootScope.isNotLoginState = function() {
            return ($state.current.name !=='login');
        }

    }

}());
