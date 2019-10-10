var express = require('express');
var path = require('path');
var partials=require('./partialRoute');
var user = require('./user/user.js');
var notification = require('./notification/notification');
var role = require('./role/role.js');
var auth=require('./userAuthentication.js');
var advice=require('./advice/advice.js');
var payee=require('./payee/payee.js');
var comment=require('./comment/comment.js');
var project=require('./project/project.js');
var bank=require('./bank/bank.js');
var mailSend=require('./Mail/mailService');
var clientConfig = require('./clientConfigRoute');
var organization = require('./organization/organization.js');
var customField=require('./customField/customField');
var paymentRequest = require('./paymentRequest/paymentRequest');
var paymentRequester = require('./paymentRequester/paymentRequester')
var virtualLedger = require('./virtualLedger/virtualLedger');

var appRoutes = function(app) {
    app.get('/getConfig', clientConfig.getConfig);
    app.post('/forgotPassword', auth.sendResetPasswordLink);
    app.post('/resetPassword', auth.resetPassword);
    app.post('/login', auth.login);
    app.get('/getPrivileges', auth.getPrivileges);


    app.post('/logout', auth.logout);
    app.get('/organizations/:name',organization.getOrgSubDomain);
    app.post('/setPassword', auth.setPassword);
    app.get('/validateResetPasswordRequest/:passwordToken', auth.validateResetPasswordRequest);

    app.put('/api/resetPasscode', auth.resetPasscode);

    //accessed by authenticated and authorized user
    app.post('/api/disburserAdviceEmail/:id', mailSend.disburserAdviceEmail);
    app.post('/api/feedbackEmail', mailSend.feedbackMail);
    app.get('/api/advices',advice.listAllAdvice);
    app.post('/api/advices/search',advice.search);
    app.get('/api/advices/searchByDateTblTab',advice.searchByDateTblTab);
    app.post('/api/advices/aggregateByProject',advice.aggregateByProject);
    app.post('/api/advices/summaryResults',advice.summarizedResult);
    app.post('/api/advices',advice.saveAdvice);
    app.put('/api/advices/approve/:id',advice.approveAdvice);
    app.put('/api/advices/reject/:id',advice.rejectAdvice);
    app.put('/api/advices/void/:id',advice.voidAdvice);
    app.post('/api/advices/edit/:id',advice.editAdvice);
    app.get('/api/advices/downloadAll',advice.downloadAll);
    app.get('/api/advices/downloadAllPerProject',advice.downloadAllPerProject);
    app.get('/api/advices/downloadProjectMatrix',advice.downloadProjectMatrix);
    app.get('/api/advices/downloadPaymentRequest',paymentRequest.downloadPaymentRequest);


    app.get('/api/advice/searchByAdviceNumber',advice.searchByAdviceNumber);
    app.get('/api/advices/fetchTotalAmount',advice.fetchTotalAmount);
    app.get('/api/advices/:id',advice.getAdvice);
    app.get('/api/advices/getShortAdvice/:id',advice.getShortAdvice);
    app.post('/api/advices/fetchAdvicesByStatus',advice.fetchAdvicesByStatus);
    app.get('/api/advices/downloadPdf/:id',advice.downloadAdvicePdf);
    app.delete('/api/advices',advice.deleteAdvice);
    app.delete('/api/advices/delete',advice.deleteAdvices);
    app.post('/api/advices/listPayeeAdvices',advice.listPayeeAdvices);



    app.patch('/api/advices/amend',advice.amendAdvice);

    app.get('/api/counts/advice',advice.getAdviceCount);
    app.get('/api/count/advice',advice.getAdviceCountBasedOnSearchCriteria);

    app.get('/api/payees',payee.listAllPayee);
    app.get('/api/count/payees',payee.getPayeeCount);
    app.get('/api/payees/byName',payee.listpayeeByName);
    app.put('/api/payees/:id',payee.editPayee);
    app.delete('/api/payees/:id',payee.deletePayee);
    app.post('/api/payee/insert',payee.savePayee);
    app.get('/api/payee/userId',payee.findPayeeByUserId);

    app.post('/api/notification/contact',notification.addContact);
    app.delete('/api/notification/email/:id',notification.deleteEmailId);
    app.delete('/api/notification/mobile/:id',notification.deleteMobileNo);
    app.post('/api/notification/changeStatus',notification.changeStatus);
    app.get('/api/notification/listManageNotification',notification.listManageNotification);
    app.post('/api/notification/editContact',notification.editContact);


    app.get('/api/admin/getEmailIds',notification.getEmailIds);
    app.get('/api/admin/getMobileNo',notification.getMobileNo);


    app.get('/api/projects',project.listAllProject);
    app.get('/api/count/projects',project.getProjectCount);
    app.get('/api/projects/byName',project.listProjectByName);
    app.post('/api/projects',project.saveProject);
    app.put('/api/projects/:id',project.editProject);
    app.delete('/api/projects/:id',project.deleteProject);

    app.get('/api/banks',bank.listAllBanks);
    app.post('/api/banks',bank.saveBanks);
    app.put('/api/banks/:id',bank.updateBank);
    app.delete('/api/banks/:id',bank.deleteBank);
    app.get('/api/count/banks',bank.getBankCount);

    app.get('/api/roles',role.listRoles);

    app.get('/api/users', user.listUser);
    app.get('/api/count/users', user.getUserCount);
    app.put('/api/users/:id',user.editUser);
    app.put('/api/users/:id',user.updateUserAfterConfirmation);
    app.post('/api/users', user.addUser);
    app.get('/api/users/:id',user.getUserById);
    app.delete('/api/users/:id',user.deleteUser);
    app.post('/api/user/setPasscode',user.changePasscode);
    app.post('/api/user/verifyPassCode', user.verifyPassCode);

    app.post('/api/customFields',customField.saveCustomField);
    app.get('/api/customFields/:type',customField.listCustomFields);
    app.delete('/api/customFields/:id',customField.deleteCustomField);
    app.put('/api/customFields/:id',customField.editCustomField);

    app.post('/api/comments',comment.addComment);
    app.post('/api/comments/:id',comment.getCommentsByAdviceId);

    //organization specific routes
    app.post('/api/organizations', organization.add);
    app.post('/api/organizations/updateStatus', organization.updateStatus);
    app.get('/api/organizations', organization.list);
    app.put('/api/organizations/uploadStamp',organization.addStamp);
    app.put('/api/organizations/uploadLogo',organization.addLogo);
    app.get('/api/organizations/:id',organization.getOrganizationById);
    app.get('/api/logo/downloadLogo',organization.downloadStapms);
    app.delete('/api/organization/deleteStamps',organization.deleteStamps);
    //organization specific routes

    //payment requests
    app.get('/api/paymentRequests/projects',paymentRequest.getProjectsOfPaymentRequests);
    app.get('/api/paymentRequest', paymentRequest.listByStatus);
    app.get('/api/counts/paymentRequest', paymentRequest.getPaymentRequestCount);
    app.get('/api/paymentRequest/:id', paymentRequest.getPaymentRequestById);
    app.post('/api/paymentRequest', paymentRequest.validatePaymentRequest, paymentRequest.create);
    app.patch('/api/paymentRequest/reject', paymentRequest.reject);
    app.patch('/api/paymentRequest/approve', paymentRequest.approve);
    app.delete('/api/paymentRequest/delete', paymentRequest.delete);
    app.delete('/api/paymentRequests/delete', paymentRequest.deletePaymentRequests);
    app.get('/api/paymentRequests/byStatus', paymentRequest.listByStatus);

    //payment requester
    app.get('/api/paymentRequester/listProject', paymentRequester.listProjectsByPaymentRequester);
    app.get('/api/paymentRequester/listProjectByUserId', paymentRequester.listProjectByUserId);

    //virtual ledgers
    app.get('/api/virtualLedgers/list', virtualLedger.list);
    app.post('/api/virtualLedgers/save', virtualLedger.save);
    app.delete('/api/virtualLedgers/delete', virtualLedger.delete);
    app.get('/api/virtualLedgers/byName', virtualLedger.listByName);
    app.get('/api/ledger/byName', virtualLedger.ledgerByName);


    //angular routes
    app.get('/partials/:name', partials);
    app.get('/*', function(req, res) {
        res.render(path.join(__dirname, '../../client/index'));
    });

};
module.exports = appRoutes;
