var PayeeModel= require('../../models/PayeeModel');
var SuccessResponse = require('../../models/SuccessResponse');
var errorResult = require('../../models/ErrorResult');
var AdviceModel= require('../../models/AdviceModel');
var UserModel= require('../../models/UserModel');
var userUtils = require('../../utils/userUtils');
var apiUtils = require('../../utils/apiUtils');
var mongoose = require('mongoose');
var Q = require('q');
 var PayeeRouter={

     /**
      * Prepare query for list the payees
      * @param req
      * @param res
      */
     prepareQuery: function(req, res) {
         var query={};
         query.organization = req.currentUser.organization;
         query.expired = false;
         return query;
     },
     /**
      * Provides payee documents based on payee name
      * @param req
      * @param res
      */
     listpayeeByName: function(req,res){
         var query= PayeeRouter.prepareQuery(req, res);
         var searchTerm = req.query.payeeName || '';
         var regExp= new RegExp(searchTerm, "i");
         if(searchTerm) {
             query.nickName =  regExp;
             var aggQuery = apiUtils.prepareFetchByNameAggregateQuery(query,'nickName');

             PayeeModel.aggregate(aggQuery
                 ,function(err,payee){
                     if(payee){
                         res.send(new SuccessResponse('OK', payee, "", apiUtils.i18n('request.success.msg')));
                     }
                     if(err){
                         res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),err));
                     }
                 })

         }else{
             res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),{}));
         }
     },
     /**
      * Provides payee docs based on on name, email and phone number fields of payee
      * @param req
      * @param res
      */
   listAllPayee: function(req,res){

       //only for pagination
       if(req.query.page) {

           var pageNo = Number((req.query.page ? req.query.page:1));
           var limitPerPage = Number((req.query.page_size ? req.query.page_size : 10));
           var sortParam = JSON.parse((req.query.sort || {}));

           /*Sort*/
           var sortField = Object.keys(sortParam)[0];
           var sortPayeeQuery = {};
           if(sortField) {
               if(sortField === 'accountNumber') {
                   /*(sortParam[sortField] === "desc" ? -1 : 1)*/
                   sortPayeeQuery[sortField]  = (sortParam[sortField] === "desc" ? -1 : 1)
               } else {
                   var field = "user.";
                   if(sortField === 'name') { field = field + "firstName" }
                   else { field = field + sortField }
                   sortPayeeQuery[field]  = (sortParam[sortField] === "desc" ? -1 : 1)
               }
           }
           /*Frame query*/
           var userMatchQuery = {}, payeeMatchQuery = {};
           payeeMatchQuery.organization = mongoose.Types.ObjectId(req.currentUser.organization);
           payeeMatchQuery.expired = false;
           var regExp;
           if(req.query.name){
               var regExp;
               var fullName = req.query.name.split(" ");
               var nameRegexObj = fullName.map(function(elem, i){ return new RegExp(elem, "i");});
               userMatchQuery['$or'] = [{ "user.firstName": {"$in": nameRegexObj} },
                                        { "user.lastName": {"$in": nameRegexObj} },
                                        { "user.middleName": {"$in": nameRegexObj} }];
           }if(req.query.email){
               regExp= new RegExp(req.query.email, "i");
               userMatchQuery['user.email'] = regExp;
           }if(req.query.phoneNumber){
               regExp= new RegExp(req.query.phoneNumber, "i");
               userMatchQuery['user.phoneNumber'] = regExp;
           }if(req.query.nickName){
               regExp= new RegExp(req.query.nickName, "i");
               userMatchQuery['nickName'] = regExp;
           }
           var aggregateQuery = [
               {$match: payeeMatchQuery},
               {$lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" }},
               {$unwind:"$user"},
               {$match: userMatchQuery}
           ];
           var skipNum = (pageNo -1)*limitPerPage;
           if(Object.keys(sortPayeeQuery).length != 0) {
               aggregateQuery.push({$sort :sortPayeeQuery});
           }
           aggregateQuery.push(
               {"$group":{"_id":null, "total":{"$sum":1}, "docs":{"$push":"$$ROOT"}}},
               {"$project":{"total":1, "result":{"$slice":["$docs",skipNum, limitPerPage]}}}
           );

           /*Fetch from db*/

           PayeeModel.aggregate(aggregateQuery, function (error, docs) {
               if (error) {
                   res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),error));
               } else {
                   var responseObj = {"limit": limitPerPage, "page": pageNo};
                   if(docs.length == 0) {
                       responseObj["docs"] = [];
                       responseObj["total"] = 0;
                       responseObj["pages"] = 1;
                   } else {
                       responseObj["docs"] = docs[0].result;
                       responseObj["total"] = docs[0].total;
                       responseObj["pages"] = Math.ceil(docs[0].total / limitPerPage) || 1;
                   }
                   res.send(new SuccessResponse('OK', responseObj.docs, responseObj, apiUtils.i18n('request.success.msg')));
                   res.end();
               }
           });
       }else {
           var query= PayeeRouter.prepareQuery(req, res);
           PayeeModel.find(query,function (err, payee) {
               if (err) {
                   res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),err));
               } else {
                   res.send(new SuccessResponse('OK', payee, "", apiUtils.i18n('request.success.msg')));
                   res.end();
               }
           }).populate('user')
       }
   },
     getPayeeCount: function(req, res) {
         var query= PayeeRouter.prepareQuery(req, res);
         var aggregateQuery = apiUtils.prepareCountAggregationQueryForAdmin(query);

         if (apiUtils.isEmptyObject(aggregateQuery)) {
             res.json({data:"empty"})
         }
         else {
             PayeeModel.aggregate(aggregateQuery,function(error,result){
                 if(result){
                     console.log("result",result)
                     res.send( new SuccessResponse(200, result, "", apiUtils.i18n('request.success.msg')) );
                 }
                 if(error){
                     res.send(new ErrorResult(404, apiUtils.i18n('payee.not.found.error.msg')));
                 }
             });
         }

     },
     /**
      * Remove specific payee document
      * @param req
      * @param res
      */
     deletePayee:function(req,res){
      queryParam= req.params;
         AdviceModel.findOne({'payee': queryParam.id}, function (err, advice) {
             if(advice){
                 return res.json(new errorResult(404, apiUtils.i18n('payee.delete.contains.advice.error.msg'), [err]))
             }else{

                 PayeeModel.findOne({_id:queryParam.id}, function(payeeError, payee) {
                     if (payee) {
                         UserModel.remove({_id:payee.user}, function(userError, result){
                             if(userError) {
                                 return res.json(new errorResult(404, apiUtils.i18n('payee.delete.error.msg'), [userError]))
                             } else {
                                 PayeeModel.remove({_id:queryParam.id}, function(error, payee) {
                                     if (error) {
                                         return res.json(new errorResult(404, apiUtils.i18n('payee.delete.error.msg'), [payeeError]))
                                     }
                                     else
                                         return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')));
                                 });
                             }
                         });
                     }
                     else{
                         return res.json(new errorResult(404, apiUtils.i18n('payee.delete.error.msg'), [payeeError]))
                     }
                 });
             }
         });
     },
     /**
      * Responsible to update payee details
      * @param req
      * @param res
      */
     editPayee:function(req,res) {
         var queryParams = req.body.q;
         var updateUserJSON = {
             firstName: queryParams.user.firstName,
             middleName: queryParams.user.middleName,
             lastName: queryParams.user.lastName,
             email:queryParams.user.email,
             phoneNumber:queryParams.user.phoneNumber
         };

         var updatePayeeJSON = {
             bankName: queryParams.bankName,
             ifscCode: queryParams.ifscCode,
             bankBranch: queryParams.bankBranch,
             accountNumber:queryParams.accountNumber,
             nickName:queryParams.nickName
            /* payeeNumber:queryParams.payeeNumber*/
         }
         PayeeRouter.validatePayeeUserForUpdation(req,'user', queryParams.oldPhoneNumber, queryParams.user, queryParams._id).then(function(validatedRes){
             UserModel.update({_id:queryParams.user['_id']},updateUserJSON,function(error, result) {
                 if (error) {
                     res.send(new errorResult('FAILED', apiUtils.i18n('user.update.error.msg'), [error]))
                 } else {
                     PayeeModel.update({ _id: queryParams._id }, updatePayeeJSON, function(error,data){
                         if (error) {
                             res.send(new errorResult('FAILED', apiUtils.i18n('user.update.error.msg'), [error]))
                         } else {
                             res.send( new SuccessResponse('OK', data, "", apiUtils.i18n('request.success.msg')) );
                             res.end();
                         }
                     })
                 }
             });
         }, function(error){
             res.status(400);
             res.send(new errorResult('FAILED', error, error))
         });
     },
     /**
      * Responsible to save new payee details
      * @param req
      * @param res
      */
   savePayee: function(req,res){
       var queryParams = req.body.q;
       queryParams.bankBranch = queryParams.bankBranch || '';
       queryParams.middleName = queryParams.middleName || '';
       var userJSON = {
           firstName: queryParams.firstName,
           middleName: queryParams.middleName,
           lastName: queryParams.lastName,
           email:queryParams.email,
           mobileno:queryParams.mobileno,
           role:queryParams.role
       };

       /*Save payee details and bank details*/
       userUtils.validateUser(req, null, null, true).then(function(validateRes){
           console.log("----------userUtils before------1");
           var serverUrl = apiUtils.getServerUrl(req);
           PayeeRouter.validateNickNameForPayeeForInsertion(req).then(function(validatedResult){
               console.log("----------userUtils before------2");
               userUtils.add(userJSON, req.currentUser.organization, req.app.locals.acl, serverUrl, true).then(function(user) {
                   console.log("----------userUtils before------3");
                   new PayeeModel(
                       {bankName: queryParams.bankName,
                       ifscCode: queryParams.ifscCode,
                       bankBranch: queryParams.bankBranch,
                       accountNumber: queryParams.accountNumber,
                       organization: req.currentUser.organization,
                       user:user, nickName: queryParams.nickName })
                       .save(function(error,newPayee) {
                           if(error){
                               /* Delete user if saving payee failed */
                               userUtils.removeUser(user['_id'], req.currentUser);
                               if(error.errmsg && error.errmsg.indexOf('$payeeNumber') > 0){
                                   res.send(new errorResult('ERROR', apiUtils.i18n('payee.number.unique.error.msg'), error));
                               } else {
                                   res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'), error));
                               }
                           }else{
                               res.send(new SuccessResponse('OK', newPayee, "", apiUtils.i18n('request.success.msg')));
                               res.end();
                           }
                       });
               }, function(error) {
                   res.send(new errorResult('ERROR', error, error))
               });
           }, function(error){
               res.send(new errorResult(400, error[0].msg, error))
           });
       }, function(error){
           res.send(new errorResult(400, error[0].msg, error))
       });
   },
     /**
      * Allows to place validations on userdetails params
      * @param req
      * @param paramPrefix
      * @param oldPhoneNo
      * @returns {*|promise}
      */
    validatePayeeUserForUpdation: function(req, paramPrefix, oldPhoneNo, user, payee) {
         req.check('q.'+paramPrefix+'.email', 'Please enter a valid email').isEmail();
         req.check('q.'+paramPrefix+'.firstName', 'Please enter first name').len(1);
         req.check('q.'+paramPrefix+'.lastName', 'Please enter last name').len(1);
         req.check('q.'+paramPrefix+'.phoneNumber', 'Please enter phone number').len(1);
         /*req.check('q.'+paramPrefix+'.mobileno', 'Please enter phone number').isMobilePhone('en-IN');*/
         req.check('q.'+paramPrefix+'.phoneNumber', 'Please enter unique phone number').isUpdatedPhoneNumberUnique(oldPhoneNo, req.currentUser.organization, user._id, true);
         req.check('q.nickName', 'Please enter unique nick name').isUniqueNickName(req.currentUser.organization, payee);
         var deferred = Q.defer();
         req.asyncValidationErrors().then(function (user) {
             deferred.resolve(user);
         }, function (errors) {
             deferred.reject(errors);
         });
         return deferred.promise;
    },
     /**
      * Allows to place validations on payee details params
      * @param req
      * @returns {*|promise}
      */
     validateNickNameForPayeeForInsertion: function(req) {
         req.check('q.nickName', apiUtils.i18n('payee.nick.name.required.error.msg')).len(1);
         req.check('q.nickName', apiUtils.i18n('payee.nick.name.unique.error.msg')).isUniqueNickName(req.currentUser.organization);
         var deferred = Q.defer();
         req.asyncValidationErrors().then(function (user) {
             deferred.resolve(user);
         }, function (errors) {
             deferred.reject(errors);
         });
         return deferred.promise;
     },
     /**
      * Provides payee details based on payee(user) Id
      * @param req
      * @param res
      */
     findPayeeByUserId:function(req, res){
         var query={organization : req.currentUser.organization, user:new mongoose.Types.ObjectId(req.query.id)};
         var populate = {path:'user', match:{}};
         query.expired = false;
         PayeeModel.findOne(query).populate(populate).exec(function (err, payee) {
             if (err) {
                 res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),err));
             } else {
                 res.send(new SuccessResponse('OK', payee, "", apiUtils.i18n('request.success.msg')));
                 res.end();
             }
         })
     }

 };
module.exports=PayeeRouter;
