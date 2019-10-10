var UserModel = require('../../models/UserModel');
var RoleModel = require('../../models/RoleModel');
var errorResult = require('../../models/ErrorResult');
var validator = require('express-validator');
var randomstring = require("randomstring");
var logger = require('../../config/logging');
var passwordHash = require('password-hash');
var SuccessResponse = require('../../models/SuccessResponse');
var AdviceModel= require('../../models/AdviceModel');
var notificationModel= require('../../models/notificationModel');
var shadedResponse = require('../../utils/shadedResponse');
const fs = require("fs");
var userUtils = require('../../utils/userUtils');
var apiUtils = require('../../utils/apiUtils');
var Q = require('q');
var ErrorResult = require('../../models/ErrorResult');
var CommentModel= require('../../models/CommentModel');
var paymentUtils = require('../../utils/paymentRequestUtils');
var PaymentRequesterModel= require('../../models/PaymentRequester');
var PaymentRequestModel= require('../../models/PaymentRequestModel');
var Q = require('q');

var userRoute = {
    /**
     * Prepare query for list the users
     * @param req
     * @param res
     */
    prepareQuery: function(req, res) {
        var query={};
        query.organization = req.currentUser.organization;
        return query;
    },
    listUser: function(req, res) {
        var query= userRoute.prepareQuery(req, res);
        //only for pagination
        if(req.query.page) {
            var page_number =req.query.page ? req.query.page:1;
            var page_size = req.query.page_size ? req.query.page_size : 10 ;

            var regExp;
            if(req.query.firstName){
                var str = req.query.firstName;
                var tokens = str.split(' ');
                var andQuery = [];

                if(tokens.length===1){
                    andQuery.push({firstName:new RegExp(tokens[0], "i")},{lastName:new RegExp(tokens[0], "i")});
                    query['$or'] = andQuery;
                }
                else{
                    ['firstName','lastName'].forEach(function(attr, ind){
                        var orQuery = [];
                        tokens.forEach(function(token,tokenInd) {
                            var ele = {};
                            ele[attr]= new RegExp(token, "i");
                            orQuery.push(ele)
                        });
                        andQuery.push({'$or':orQuery})
                    });
                    query['$and'] = andQuery;
                }
            }if(req.query.email){
                regExp= new RegExp(req.query.email, "i");
                query.email=regExp;
            }if(req.query.phoneNumber){
                regExp= new RegExp(req.query.phoneNumber, "i");
                query.phoneNumber=regExp;
            } if(req.query.isPayeeNotAllowed) {
                query.roles = {'$ne':'ROLE_PAYEE'};
            }


            // Refer for paginate https://www.npmjs.com/package/mongoose-paginate
            UserModel.paginate(query, { page: Number(page_number), limit: Number(page_size)  }, function(err, response) {
                if (err) {
                    res.send(new errorResult('ERROR', "failed",err));
                } else {
                    res.send(new SuccessResponse('OK', response.docs, response, "success") );
                    res.end();
                }
            });
        }else {
            var query= userRoute.prepareQuery(req, res);
            UserModel.find(query,function (err, user) {
                if (err) {
                    res.send(new errorResult('ERROR', "failed",error));
                } else {
                    res.send(new SuccessResponse('OK', user, "", "success") );
                    res.end();
                }
            })
        }
    },
    getUserCount: function(req, res) {
        var query= userRoute.prepareQuery(req, res);
        query.roles = {'$ne':'ROLE_PAYEE'}
        var aggregateQuery = apiUtils.prepareCountAggregationQueryForAdmin(query);

        if (apiUtils.isEmptyObject(aggregateQuery)) {
            res.json({data:"empty"})
        }
        else {
            UserModel.aggregate(aggregateQuery,function(error,result){
                if(result){
                    console.log("result",result)
                    res.send( new SuccessResponse(200, result, "", "success") );
                }
                if(error){
                    res.send(new ErrorResult(404, 'User not found'));
                }
            });
        }

    },
    addUser: function(req, res) {
        var queryParams = req.body.q;
        userUtils.validateUser(req).then(function(validateRes){
            var serverUrl = apiUtils.getServerUrl(req);
            userUtils.add(queryParams, req.currentUser.organization, req.app.locals.acl, serverUrl).then(function(user) {
                if(user && (user.roles.indexOf('ROLE_PAYMENT_REQUESTER') !== -1) && queryParams.project) {
                    console.log("ROLE_PAYMENT_REQUESTER",queryParams.project)
                    paymentUtils.savePaymentRequester(user,queryParams.project).then(function(paymentRequesterUser) {
                        res.send(new SuccessResponse('OK', paymentRequesterUser, {}, "User saved successfully"));
                    }, function(error) {
                        console.log("savePaymentRequester FAILED",error)
                        res.send(new errorResult('FAILED', error, error))
                    });
                }
                else {
                    res.send(new SuccessResponse('OK', user, {}, "User saved successfully"));
                }
            }, function(error) {
                res.send(new errorResult('FAILED', error, error))
            });

        }, function(error){
            res.status(400);
            res.send(new errorResult('FAILED', error, error))
        })
    },

    editUser : function(req, res) {
        var queryParams = req.body.q;
        // forceFlag is a flag from client side to forcebly delete the project
        var forceFlag = req.body.forceFlag;
        userUtils.validateUser(req, req.params.id, queryParams.oldPhoneNumber).then(function(validationMsg){
            userRoute.updateUser( queryParams, req, res,forceFlag );
        }, function( error ){
            res.status(400);
            res.send(new errorResult('FAILED', error, error))
        });
    },
    updateUser : function( queryParams, req, res,forceFlag ) {
        console.log("coming gere")
        var name,contentType,size,base64;
        //get the roles from db and sasogn to user
        var user = req.currentUser;
        var result = userUtils.isLoginUser(user.email,queryParams.email);
        //check login user and updating user is same and having ROLE_MASTERADMIN role, if yes then user can not remove his admin role
        if(result && user.roles.indexOf("ROLE_MASTERADMIN") !== -1 && queryParams.roles.indexOf("ROLE_MASTERADMIN") == -1) {
            queryParams.roles.push("ROLE_MASTERADMIN");
        }
        var oldUserRoles;
        var oldUserId;
        var oldProject;
        userUtils.getUserById(req.params.id).then(function(oldUser) {
            oldUserRoles = oldUser.roles;
            oldUserId = oldUser._id;
            if(forceFlag){
                PaymentRequesterModel.findOne({user:oldUser._id}).then(function(paymentRequester) {
                    if(paymentRequester) {
                        if(paymentRequester.assignedProject && queryParams.project._id && paymentRequester.assignedProject.toString() !== queryParams.project._id) {
                            PaymentRequestModel.count({project:paymentRequester.assignedProject,requestedUser:oldUser._id},function(err,count){
                                if(count > 0) {
                                    res.send(new errorResult(401, "Project is associated with payment request", err))
                                }
                                if(count == 0){
                                    userRoute.updateUserAfterConfirmation(queryParams,req,res,oldUserRoles);
                                }
                            })
                        }
                        else if(paymentRequester.assignedProject.toString() === queryParams.project._id ){
                            userRoute.updateUserAfterConfirmation(queryParams,req,res,oldUserRoles);
                        }
                        else {
                            res.send(new errorResult(400, "ERORRR", "ERORRR"))
                        }
                    }else{
                        userRoute.updateUserAfterConfirmation(queryParams,req,res,oldUserRoles);
                    }
                }, function(error) {
                    res.send(new errorResult('FAILED', error, error))
                });
            }else{
                userRoute.updateUserAfterConfirmation(queryParams,req,res,oldUserRoles);
            }

        }, function(error) {
            res.send(new errorResult('FAILED', error, error))
        });




    },
    updateUserAfterConfirmation : function(queryParams,req,res,oldUserRoles){
        RoleModel.where('name').in(queryParams.roles).exec(function(error, roles){
            var updatedRoles = [];
            //collect roles and assign to user
            if(roles) {
                for (var i=0; i < roles.length; i++) {
                    updatedRoles.push(roles[i].name)
                }
            }
            updatedRoles.reverse();
            if(queryParams.signature){
                console.log(queryParams.signature.filename);
                name=queryParams.signature.filename;
                contentType=queryParams.signature.filetype;
                size=queryParams.signature.filesize;
                base64=queryParams.signature.base64;
            }else{
                name='';
                contentType='';
                size='';
                base64='';
            }
            // call the built-in save method to save to the database
            UserModel.update({_id:req.params.id},
                {
                    firstName: queryParams.firstName,
                    middleName: queryParams.middleName,
                    lastName: queryParams.lastName,
                    email:queryParams.email,
                    phoneNumber:queryParams.mobileno,
                    signature:{
                        filename:name,
                        filetype:contentType,
                        filesize:size,
                        base64:base64
                    },
                    roles: updatedRoles,
                    enabled: queryParams.enabled
                },
                function(error, result) {
                    if (error) {
                        res.status(400);
                        return res.json(new errorResult(400, "Error occurred while retrieving user", [error]))
                    }
                    req.app.locals.acl.removeUserRoles( req.params.id.toString(), updatedRoles, function(errorOnRemoveRoles) {
                        if (errorOnRemoveRoles){
                            res.status(400);
                            return res.json(new errorResult(400, "Error occurred while saving roles", [errorOnRemoveRoles]))
                        }
                        if( updatedRoles.length > 0 ) {
                            req.app.locals.acl.addUserRoles(req.params.id.toString(), updatedRoles, function (errorOnAddRoles) {
                                if (errorOnAddRoles) {
                                    res.status(400);
                                    return res.json(new errorResult(400, "Error occurred while saving roles", [errorOnAddRoles]))
                                }
                                if(queryParams.roles.indexOf('ROLE_PAYMENT_REQUESTER') !== -1 && queryParams.project) {
                                    console.log("queryParams.project")
                                    console.log(queryParams.project)
                                    console.log("queryParams.project")
                                    paymentUtils.updatePaymentRequester(queryParams._id,queryParams.project,req.currentUser.organization).then(function(payementRequesterUser) {
                                        res.send(new SuccessResponse(200, payementRequesterUser, {}, "User saved successfully"));
                                    }, function(error) {
                                        res.send(new errorResult(400, error, error))
                                    });
                                }
                                else if(queryParams.roles.indexOf('ROLE_PAYMENT_REQUESTER') < 0 && oldUserRoles.indexOf('ROLE_PAYMENT_REQUESTER') !== -1 ) {
                                    paymentUtils.deletePaymentRequester(queryParams._id,req.currentUser.organization).then(function(payementRequesterUser) {
                                        res.send(new SuccessResponse(200, payementRequesterUser, {}, "Payment requester deleted successfully"));
                                    }, function(error) {
                                        res.send(new errorResult(400, error, error))
                                    });
                                }
                                else {
                                    res.status(200);
                                    return res.json(new SuccessResponse(200, {}, {}, "success"));
                                }
                            });
                        } else{
                            res.status(200);
                            return res.json(new SuccessResponse(200, {}, {}, "success"));
                        }
                    });
                });
        });
    },
    deleteUser : function(req, res) {
        logger.debug(req.query.q);
        req.check('id', 'Required ID is not present in query').len(1);
        req.asyncValidationErrors().then(function(user) {
            if (req.currentUser) {
                userUtils.deleteUser( req.params.id, req.currentUser ).then(function (data) {
                    res.send(new SuccessResponse('OK', data, "", "success"));
                }, function (err) {
                    res.send(new ErrorResult('FAILED', err));
                });
            }else {
                return res.send(new ErrorResult('FAILED', 'User not found'));
            }
        }).catch(function(errors) {
            res.status(500);
            logger.error(errors);
            return res.json(new errorResult('ERROR', "failed", errors));
        });
    },
    getUserById: function(req,res){
        UserModel.findOne({_id:req.params.id},function(err,user){
            if(err){
                res.send(new errorResult('ERROR', "failed",err));
            }
            else{
                res.send(JSON.stringify(new SuccessResponse('OK', shadedResponse(JSON.parse(JSON.stringify(user))), "", "success") ));
                res.end();
            }
        })
    },
    changePasscode: function(req,res){
        var queryParams = req.body;
        UserModel.findOne({ _id: queryParams.id }, function(error, user) {
            if(user){
                if (userRoute.validate(user, queryParams.existingPasscode)){
                    if ( queryParams.passcode1 === undefined || queryParams.passcode2 === undefined ||
                        queryParams.passcode1 !== queryParams.passcode2) {
                        return res.json(new errorResult(404, "Passcodes does not match",  [{'msg':'Passwords does not match'}]))
                    }
                    else if(queryParams.passcode1.length<8) {
                        return res.json(new errorResult(400, apiUtils.i18n('passcode.error.length.msg'),  [{'msg':apiUtils.i18n('passcode.error.length.msg')}]));
                    }else if(userRoute.validate(user, queryParams.passcode1)) {
                        return res.json(new errorResult(404, "Current passcode and new passcode should not be same",  [{'msg':'Current passcode and new passcode should not be same'}]));
                    }
                    else{
                        UserModel.update({ _id: queryParams.id },{passcode:passwordHash.generate(queryParams.passcode1)}, function(error, user) {
                            if (error) {
                                return res.json(new errorResult(404, "Error occurred while changing passcode", [error]))
                            }
                            return res.json(new SuccessResponse(200, {}, {}, "success"))


                        });
                    }
                }else {
                    return res.json(new errorResult(404, "Invalid passcode", [{'msg':'passcode is incorrect'}]))
                }
            }
        })
    },
    validate: function(user, passcode) {
        return passwordHash.verify(passcode, user.passcode);
    },
    verifyPassCode:function(req,res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        if (req.currentUser) {
            var user = req.currentUser;
            var passCodeMatched = apiUtils.validate(user, queryParam.passcode);
            if (passCodeMatched) {
                if(queryParam.comment){
                    var comment = new CommentModel({
                        text: queryParam.comment,
                        user: user._id,
                        organization: req.currentUser.organization
                    });
                    comment.save(function (err, data) {
                        if (err) {
                            return res.send(err);
                        } else {
                            AdviceModel.update({"_id":queryParam.advice._id},{"$addToSet":{comments:data._id}},function(error, advice){
                                if(error) {
                                    console.log("Failed to save comment Id: "+data._id+" in advice: "+queryParam.advice._id);
                                    return res.send(error);
                                }
                            });
                        }
                    })
                }else{
                    console.log('comment not exist');
                }
                return res.send(new SuccessResponse('OK', user, "", "success"));
            } else {
                return res.send(new ErrorResult('FAILED', 'pass code not matching'));
            }
        }else {
            return res.send(new ErrorResult('FAILED', 'pass code not matching'));
        }
    }
};

module.exports = userRoute;

