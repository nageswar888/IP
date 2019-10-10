/**
 * Created by sukesh on 22/10/16.
 */
(function(){
    'use strict';

    angular.module('sbpo')

        .factory('api', api);

    api.$inject = ['$resource','$rootScope'];

    //clinical trail API for data calls
    function api ($resource, $rootScope) {
        return $resource('/', getParamDefaults(), getActions($rootScope));
    }

    //default parameters will go here..
    var getParamDefaults = function() {
        return {
            id:'@id'
        };
    };

    //default actions and methods will go here..
    var getActions = function() {
        return {
            'getAllBanks':{
                method : 'GET',
                url: '/api/banks'
            },
            'resetPassword':{
                method : 'POST',
                url: '/resetPassword'
            },
            'forgotPassword':{
                method : 'POST',
                url: '/forgotPassword'
            },
            'submitBank':{
                method : 'POST',
                url: '/api/banks'
            },

            'deleteBank':{
                method : 'DELETE',
                url: '/api/banks/:id'
            },
            'deleteProject':{
                method : 'DELETE',
                url: '/api/projects/:id'
            },
            'logout':{
                method : 'POST',
                url: '/logout'
            },
            'submitProject':{
                method : 'POST',
                url: '/api/projects'
            },
            'editBankDetail':{
                method : 'PUT',
                url: '/api/banks/:id'
            },
            'editProject':{
                method : 'PUT',
                url: '/api/projects/:id'
            },
            'authenticate' : {
                method : 'POST',
                url: '/login'
            },
            'getPrivileges':{
                method : 'GET',
                url: '/getPrivileges'
            },
            'searchByDate' : {
                method : 'POST',
                url: '/api/advices/search'
            },
            'searchByDateTblTab' : {
                method : 'GET',
                url: '/api/advices/searchByDateTblTab'
            },
            'aggregateByProject' : {
                method : 'POST',
                url: '/api/advices/aggregateByProject'
            },

            'adviceList': {
                method : 'get',
                url: '/api/advices'
            },
            'approveAdvice': {
                method: 'PUT',
                url: '/api/advices/approve/:id'
            },
            'rejectAdvice': {
                method: 'PUT',
                url: '/api/advices/reject/:id'
            },
            'voidAdvice': {
                method: 'PUT',
                url: '/api/advices/void/:id'
            },
            'editPayee': {
                method: 'PUT',
                url: '/api/payees/:id'
            },
            'deletePayee': {
                method: 'DELETE',
                url: '/api/payees/:id'
            },
            'editAdvice': {
                method: 'POST',
                url: '/api/advices/edit/:id'
            },
            'viewAdvice': {
                method: 'GET',
                url: '/api/advices/:id'
            },
            'adviceCount':{
                method: 'GET',
                url: '/api/counts/advice'
            },
            'advicesByRole':{
                method: 'POST',
                url:'/api/advices/fetchAdvicesByStatus'
            },
            'postAdvice': {
                method: 'POST',
                url: '/api/advices'
            },
            'getPayees': {
                method:'GET',
                url:'/api/payees'
            },
            'getPayeesByName': {
                method:'GET',
                url:'/api/payees/byName'
            },
            'getPayeeByUserId':{
                method:'GET',
                url:'/api/payee/userId'
            },
            'getProjects': {
                method:'GET',
                url:'/api/projects'
            },
            'getProjectByName':{
                method:'GET',
                url:'/api/projects/byName'
            },
            'getAllRoles': {
                method:'GET',
                url:'/api/roles'
            },
            'postPayee':{
                method: 'POST',
                url: '/api/payee/insert'
            },
            'postLedger':{
                method: 'POST',
                url: '/api/ledger/insert'
            },
            'listUser':{
                method:'GET',
                url:'/api/users'
            },
            'editUser': {
                method: 'PUT',
                url: '/api/users/:id'
            },
            'deleteUser':{
                method: 'DELETE',
                url: '/api/users/:id'
            },
            'getUserById':{
                method: 'GET',
                url: '/api/users/:id'
            },
            'postComment':{
                method: 'POST',
                url: '/api/comments'
            },

            'submitUser':{
                method: 'POST',
                url: '/api/users'
            },

            'getCommentsByAdviceId':{
                method: 'POST',
                url: '/api/comments/:id'
            },
            'changePassword':{
                method: 'POST',
                url: '/setPassword'
            },
            'changePasscode':{
                method: 'POST',
                url: '/api/user/setPasscode'
            },
            'feedbackMail':{
                method : 'POST',
                url: '/api/feedbackEmail'
            },
            'getConfig':{
                method : 'GET',
                url: '/getConfig'
            },
            'getOrganizations':{
                method: 'GET',
                url: '/api/organizations'
            },
            'saveOrg':{
                method: 'POST',
                url: '/api/organizations'
            },
            'updateOrg':{
                method: 'POST',
                url: '/api/organizations/updateStatus'
            },
            'verifyPasscode':{
                method: 'POST',
                url:'/api/user/verifyPassCode'
            },
            'saveContact':{
                method: 'POST',
                url:'/api/notification/contact'
            },
            'deleteEmailId':{
                method : 'DELETE',
                url: '/api/notification/email/:id'
            },
            'addMobileNo':{
                method: 'POST',
                url:'/api/notification/mobile'
            },
            'deleteMobileNo':{
                method : 'DELETE',
                url: '/api/notification/mobile/:id'
            },
            'changeStatus':{
                method: 'POST',
                url:'/api/notification/changeStatus'
            },
            'listManageNotification':{
                method: 'GET',
                url:'/api/notification/listManageNotification'
            },
            'searchByAdviceNumber':{
                method: 'GET',
                url:'/api/advice/searchByAdviceNumber/'
            },
            'submitCustomField':{
                method: 'POST',
                url:'/api/customFields'
            },
            'listCustomFields':{
                method: 'GET',
                url:'/api/customFields/:type'
            },
            'deleteCustomField':{
                method : 'DELETE',
                url: '/api/customFields/:id'
            },
            'editCustomField':{
                method : 'PUT',
                url: '/api/customFields/:id'
            },
            'getEmailIds':{
                method: 'GET',
                url:'/api/admin/getEmailIds'
            },
            'getMobileNo':{
                method: 'GET',
                url:'/api/admin/getMobileNo'
            },
            'uploadStamp':{
                method: 'PUT',
                url: '/api/organizations/uploadStamp'
            },
            'uploadLogo':{
                method: 'PUT',
                url: '/api/organizations/uploadLogo'
            },
            getOrganizationById:{
                method: 'GET',
                url: '/api/organizations/:id'
            },
            'deleteAdvice':{
                method : 'DELETE',
                url: '/api/advices'
            },
            'editContact':{
                method : 'POST',
                url: '/api/notification/editContact'
            },
            'submitPaymentRequest':{
                method : 'POST',
                url : '/api/paymentRequest'
            },
            paymentRequesterProjectList:{
                method: 'GET',
                url: '/api/paymentRequester/listProject'
            },
            paymentRequesterProjectListByUserID: {
                method: 'GET',
                url: '/api/paymentRequester/listProjectByUserId'
            },
            paymentRequestList: {
                method: 'GET',
                url: '/api/paymentRequest'
            },
            paymentRequestListByProjectId: {
                method: 'GET',
                url: '/api/paymentRequest'
            },
            paymentRequestById: {
                method: 'GET',
                url: '/api/paymentRequest/:id'
            },
            RejectPaymentRequest: {
                method: 'PATCH',
                url: '/api/paymentRequest/reject'
            },
            approvePaymentRequest: {
                method: 'PATCH',
                url: '/api/paymentRequest/approve'
            },
            amendDisbursedAdvice: {
                method: 'PATCH',
                url: '/api/advices/amend'
            },
            searchPaymentHistory: {
                method: 'POST',
                url: '/api/advices/listPayeeAdvices'
            },
            getAdviceCountBasedOnSearchCriteria: {
                method: 'GET',
                url: '/api/count/advice'
            },
            fetchTotalAmount: {
                method: 'GET',
                url: '/api/advices/fetchTotalAmount'
            },
            deleteStamps: {
                method: 'DELETE',
                url: '/api/organization/deleteStamps'
            },
            deletePaymentRequest: {
                method: 'DELETE',
                url: '/api/paymentRequest/delete'
            },
            getUserCount: {
                method: 'GET',
                url: '/api/count/users'
            },
            getPayeeCount: {
                method: 'GET',
                url: '/api/count/payees'
            },
            getBankCount: {
                method: 'GET',
                url: '/api/count/banks'
            },
            getProjectCount: {
                method: 'GET',
                url: '/api/count/projects'
            },
            getPaymentRequestCount: {
                method: 'GET',
                url: '/api/counts/paymentRequest'
            },
            listVirtualLedger: {
                method: 'GET',
                url: '/api/virtualLedgers/list'
            },
            saveVirtualLedger: {
                method: 'POST',
                url: '/api/virtualLedgers/save'
            },
            deleteVirtualLedger: {
                method: 'DELETE',
                url: '/api/virtualLedgers/delete'
            },
            getVirtualLedgersByName: {
                method: 'GET',
                url: '/api/virtualLedgers/byName'
            },
            deleteAdvices: {
                method: 'DELETE',
                url: '/api/advices/delete'
            },
            deleteSelectedPaymentRequests: {
                method: 'DELETE',
                url: '/api/paymentRequests/delete'
            },
            getPaymentRequesterProjects:{
                method: 'GET',
                url: '/api/paymentRequests/projects'
            },
            getPaymentRequestsByStatus: {
                method: 'GET',
                url: '/api/paymentRequests/byStatus'
            },
            getLedgerByName:{
                method: 'GET',
                url: '/api/ledger/byName'
            },
            'resetPasscode':{
                method: 'PUT',
                url: '/api/resetPasscode'
            }
        }
    }
}());
