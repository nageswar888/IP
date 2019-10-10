/**
 * Created by semanticbits on 19/10/16.
 */
var passwordHash = require('password-hash');
var UserModel=require('../models/UserModel');
var ErrorResult = require('../models/ErrorResult');
var jwt = require('jwt-simple');
var mailSender = require('./mailer/email-sender');
var randomstring = require("randomstring");
var SuccessResponse = require('../models/SuccessResponse');
var AuthToken = require('../models/AuthToken');
var userModel=require('../models/UserModel');
var privilegeModel=require('../models/PrivilegeModel');
var roleModel=require('../models/RoleModel');
var appConfig = require('../utils/apiUtils').getExternalConfigFile();
var apiUtils = require('../utils/apiUtils');
var organizationUtils = require('../utils/organizationUtils');
var userUtils=require("../utils/userUtils")
var passwordHash = require('password-hash');
var Q = require('q');


var auth={
    login:function(req,res){
        var subdomain = apiUtils.getSubDomain(req);
        organizationUtils.findOneByQuery({subDomain: subdomain}).then(function(organization){
            if (!organization.enabled) {
                return res.json(new ErrorResult(403, apiUtils.i18n('org.deactivated.error.msg'), [{'msg':apiUtils.i18n('org.deactivated.error.msg')}]))
            }
            var username = req.body.username;
            var password = req.body.password;
            if (username === '' || password === '') {
                return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.invalid.credential'), [{'msg':apiUtils.i18n('user.invalid.credential')}]))
            }
            //convert userName to lowercase
            username = apiUtils.setToLowerCase(username);
            /*username = new RegExp(username,'i');*/
            // Fire a query to your DB and check if the credentials are valid
            UserModel.findOne({email: username, organization: organization._id}, function (error, user) {
                if(user!==null){
                    if ( (user.enabled===true && user.first_time_login=== true) || (user.enabled===true && user.first_time_login=== false) || (user.enabled===false && user.first_time_login=== true)) {
                        if (auth.validate(user, password)){
                            var tokenDetails = genToken(user);
                            var newUser = new AuthToken({ user: user._id, authToken: tokenDetails.token });
                            newUser.save(function(err,data){
                                if (err){
                                    return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.save.error.msg'), [{'msg':apiUtils.i18n('user.save.error.msg')}]))
                                }
                            });
                            return res.json(new SuccessResponse('OK', tokenDetails,''));
                        } else {
                            return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.invalid.credential'), [{'msg':apiUtils.i18n('user.invalid.credential')}]))
                        }
                    }
                    else {
                        return res.json(new ErrorResult(403, apiUtils.i18n('user.account.deactivated.error.msg'),
                            [{'msg':apiUtils.i18n('user.account.deactivated.error.msg')}]))
                    }
                }
                else {
                    return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.invalid.credential'), [{'msg':apiUtils.i18n('user.invalid.credential')}]))
                }
            });
        }, function(error){
            return res.json(new ErrorResult('FAILED', apiUtils.i18n('org.not.found.with.sub.domain.error.msg'),
                [{'msg':apiUtils.i18n('org.not.found.with.sub.domain.error.msg')}]))
        });

    },
    getPrivileges:function(req,res){
        var queryParam=req.query;
        /*var query=Object.values(queryParam);*/
        /*var a = {};*/
        var query = Object.keys(queryParam).map(function(key) {
            return queryParam[key];
        });

        getPrivilegeOnRole(query).then(function(privObj){
            return res.json(new SuccessResponse(200, privObj,''));
        });
    },
    validate: function(user, password) {
        return passwordHash.verify(password, user.password);
    },
    setPassword : function(req, res) {
        var queryParams = req.body;
        UserModel.findOne({ _id: queryParams.id }, function(error, user) {
            if(user){
                if (auth.validate(user, queryParams.existingPassword)){
                    if ( queryParams.password1 === undefined || queryParams.password2 === undefined ||
                        queryParams.password1 !== queryParams.password2 ) {
                        return res.json(new ErrorResult(404, apiUtils.i18n('user.password.match.error.msg'),  [{'msg':apiUtils.i18n('user.password.match.error.msg')}]))
                    }
                    else if(queryParams.password1.length<8) {
                        return res.json(new ErrorResult(400, apiUtils.i18n('password.error.length.msg'),  [{'msg':apiUtils.i18n('password.error.length.msg')}]));
                    }else if(auth.validate(user, queryParams.password1) ) {
                        return res.json(new ErrorResult(404, apiUtils.i18n('user.same.password.error.msg'),  [{'msg':apiUtils.i18n('user.same.password.error.msg')}]));
                    }
                    else{
                        UserModel.update({ _id: queryParams.id },{password:passwordHash.generate(queryParams.password1), enabled:true, first_time_login:false}, function(error, user) {
                            if (error) {
                                return res.json(new ErrorResult(404, apiUtils.i18n('user.change.password.error.msg'), [error]))
                            }
                            return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')))


                        });
                    }
                }else {
                    return res.json(new ErrorResult(404,  apiUtils.i18n('user.invalid.credential'), [{'msg':apiUtils.i18n('user.invalid.credential')}]))
                }
            }
            else {
                return res.json(new ErrorResult(404, apiUtils.i18n('user.retrieve.error.msg'), [error]))
            }
        })

    },
    sendResetPasswordLink : function(req, res) {
        req.check('q.username', apiUtils.i18n('user.invalid.email.error.msg')).isEmail();
        var subdomain = apiUtils.getSubDomain(req);
        var queryParams = req.body.q;
        var mailConfig=appConfig.mail;
        req.asyncValidationErrors().then(function(user) {
            organizationUtils.findOneByQuery({subDomain: subdomain}).then(function(organization){
                if(organization) {
                    // get a user with ID of 1
                    UserModel.findOne({ email: queryParams.username, organization:organization._id }, function(error, user) {
                        if (error) {
                            res.status(400);
                            return res.json(new ErrorResult(400,  apiUtils.i18n('user.retrieve.error.msg'), [error]))
                        }
                        if (!organization.enabled) {
                            return res.json(new ErrorResult(403, apiUtils.i18n('org.deactivated.error.msg'), [{'msg':apiUtils.i18n('org.deactivated.error.msg')}]))
                        }

                        if(!user) {
                            return res.json(new ErrorResult(404, apiUtils.i18n('user.not.found.error.msg'), [{'msg':apiUtils.i18n('user.not.found.error.msg')}]))
                        } else if (user && (user.enabled===true || user.first_time_login=== true)) {
                            var passwordToken = randomstring.generate(8) + Date.now();//reset password token
                            var serverUrl = req.protocol + '://' + req.get('host');//get server url
                            //create mail map
                            var locals = {
                                fullName: user.firstName + ' ' + user.lastName,
                                toEmail: user.email,
                                subject: mailConfig.forgotPassworSubject,
                                url: serverUrl + '/validateResetPasswordRequest/' + passwordToken,
                                linkExpiryTime: "15 minutes"
                            };
                            //send email
                            mailSender.sendEmail('password_reset', locals, function (err, responseStatus, html, text) {
                                if (err) {
                                    res.status(500);
                                    console.log(err);
                                    return res.json(new ErrorResult(500, apiUtils.i18n('user.reset.password.email.error.msg'),
                                        [{'msg': apiUtils.i18n('user.reset.password.email.error.msg')}]))
                                } else {
                                    console.log("Email sent successfully");
                                    res.status(200);
                                    return res.json(new SuccessResponse(200, user, {}, apiUtils.i18n('request.success.msg')))
                                }
                            });
                            //save token to db
                            user.passwordToken = passwordToken;
                            user.save(function (err) {
                                if (err) {
                                    res.status(500);
                                    console.log(err);
                                    return res.json(new ErrorResult(500, apiUtils.i18n('user.save.password.token.error.msg'), [{'msg': apiUtils.i18n('user.save.password.token.error.msg')}]))
                                }
                            });
                        } else {
                            return res.json(new ErrorResult(403, apiUtils.i18n('user.account.deactivated.error.msg'),
                                [{'msg':apiUtils.i18n('user.account.deactivated.error.msg')}]))
                        }
                    });
                }
                else {
                    return res.json(new ErrorResult(404, apiUtils.i18n('org.not.found.error.msg'),
                        [{'msg':apiUtils.i18n('org.not.found.error.msg')}]))
                }
            })
        }).catch(function(errors) {
            res.status(400);
            console.log(errors);
            return res.json(new ErrorResult(400, apiUtils.i18n('validation.failed.error.msg'), errors))
        });
    },
    validateResetPasswordRequest : function(req, res) {
        var passwordToken = req.params.passwordToken;
        //check if token present in reset password request
        if (passwordToken) {
            //get the user with this token from DB
            UserModel.findOne({passwordToken: passwordToken}, function (error, user) {
                if (user) {
                    //get the token creation time substring
                    var tokenCreationTime = passwordToken.substring(8);
                    //calculate difference between now and token creation time
                    var timeElapsed = (Date.now() - tokenCreationTime) / (1000 * 60 * 15); //in minute
                    if (timeElapsed > 1) {//should not be more than 15 minutes
                        return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.reset.password.link.expired.error.msg'), [{'msg':apiUtils.i18n('user.reset.password.link.expired.error.msg')}]))
                    } else {//redirect to reset password page
                        res.redirect('/resetPassword?username='+user.email+'&passwordtoken='+user.passwordToken);
                        return;
                    }
                } else {
                    return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.reset.password.invalid.token.error.msg'), [{'msg':apiUtils.i18n('user.reset.password.invalid.token.error.msg')}]));
                }
            });
        } else {
            return res.json(new ErrorResult('FAILED', apiUtils.i18n('user.reset.password.token.missing.error.msg'), [{'msg': apiUtils.i18n('user.reset.password.token.missing.error.msg')}]))
        }
    },
    logout:function(req, res){
        var authToken = req.headers["auth-token"];

        AuthToken.remove({authToken: authToken},function(err,data){
            if(err){
                res.send(new ErrorResult('FAILED', apiUtils.i18n('user.token.not.found.error.msg'), [{'msg': apiUtils.i18n('user.token.not.found.error.msg')}]));
            }

            else {
                res.send( new SuccessResponse('OK', data, "", apiUtils.i18n('request.success.msg')) );
            }

        });
    },
    resetPassword:function(req,res){
        var querParam=req.body;
        userModel.findOne({email:querParam.username,passwordToken:querParam.passwordtoken},function(err,data){
            if(err){
                res.send(new ErrorResult(404, apiUtils.i18n('request.failed.msg'),err));
            }
            else if(data===null){
                res.send(new ErrorResult(404, apiUtils.i18n('user.reset.password.link.expired.error.msg'), [{'msg':apiUtils.i18n('user.reset.password.link.expired.error.msg')}]));
            }
            else if(querParam.password.length<8) {
                res.send(new ErrorResult(400, apiUtils.i18n('password.error.length.msg'),  [{'msg':apiUtils.i18n('password.error.length.msg')}]));
            }
            else{
                userModel.update(
                    { email: querParam.username },
                    {
                        password:passwordHash.generate(querParam.password),
                        passwordToken: ""
                    },
                    { upsert: true },function(err,data){
                        if(err){
                        }
                        else {
                            res.send( new SuccessResponse(200, data, "", apiUtils.i18n('request.success.msg')) );
                        }
                    }
                )

            }
        })},
    resetPasscode: function (req,res) {
        var queryParam=req.body;
        userUtils.getUserById(req.currentUser._id).then(function(user){
            if(passwordHash.verify(queryParam.password, user.password)){
                if(queryParam.passcode.length<8) {
                    res.send(new ErrorResult(400, apiUtils.i18n('passcode.error.length.msg'),  [{'msg':apiUtils.i18n('passcode.error.length.msg')}]));
                }
                else {
                    user.passcode=passwordHash.generate(queryParam.passcode);

                    new userModel(user).save(function(err,data){
                        if(err){
                            res.send(new ErrorResult(404, apiUtils.i18n('request.failed.msg'),err));

                        }
                        else {
                            res.send( new SuccessResponse(200, data, "", apiUtils.i18n('request.success.msg')) );
                        }
                    });
                }

            }
            else{
                res.send(new ErrorResult(404, apiUtils.i18n('password.not.match')));
            }
        })
    }
};
// private method
function genToken(user) {
    var secret = require('../config/secret');
    var expires = expiresIn(7); // 7 days
    var token = jwt.encode({
        exp: expires
    },secret());

    return {
        token: token,
        expires: expires,
        user: shadedResponse(JSON.parse(JSON.stringify(user))),
        isAuthenticated:true
    };
}
/**
 *
 * @param roles
 * @returns {*|promise}
 */
function getPrivilegeOnRole(roles){
    var privObj = {};
    var deferred = Q.defer();
    var populate = {path:'privileges', select:'code -_id'};
    roleModel.find({name:{"$in":roles}})
        .populate(populate)
        .exec(function(err,rolesData){
            if(rolesData){
                rolesData.forEach(function(privilege,index){
                    var codeArr=[];
                    privilege.privileges.forEach(function(code){
                        codeArr.push(code.code);
                    });
                    privObj[privilege.name]=codeArr;
                    if(index===rolesData.length-1){
                        deferred.resolve(privObj)
                    }
                });
            }
            else {
                deferred.reject(err);
                console.log("Error",err);
            }
        });
    return deferred.promise;
}


/**
 * Get advice by advice id
 * @param response
 * @returns {shaded object}
 */
function shadedResponse(response){
    if(typeof response==='object')    {
        for (var property in response) {
            if(typeof response[property]==='object'){
                response[property] = shadedResponse(response[property]);
            }
            else {
                if(property==="password"){
                    delete response[property]
                }
                else if(property==="passcode"){
                    delete response[property]
                }
                else if(property==="__v"){
                    delete response[property]
                }

            }
        }
    }
    return response;
}

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}
module.exports = auth;
