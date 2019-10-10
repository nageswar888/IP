var Q = require('q');
var SuccessResponse = require('../../models/SuccessResponse');
var OrganizationModel = require('../../models/OrganizationModel');
var ErrorResult = require('../../models/ErrorResult');
var organizationUtils = require('../../utils/organizationUtils');
var userUtils = require('../../utils/userUtils');
var apiUtils = require('../../utils/apiUtils');
var mailService = require('../Mail/mailService');
var mongoose = require('mongoose');

var OrganizationRoute = {
    list: function(req, res) {
        var queryParams = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        //only for pagination
        if( queryParams.page ) {
            var page_number = queryParams.page ? queryParams.page:1;
            var page_size = queryParams.page_size ? queryParams.page_size : 10 ;

            var query={};
            //Skip super admin organization
            query.$and = [ { subDomain: { $ne: 'admin' } } ];
            if(queryParams.name){
                query.name = new RegExp(queryParams.name, "i");
            }
            if(queryParams.subDomain){
                query.$and.push( {subDomain : new RegExp(queryParams.subDomain, "i")} );
            }

            // Refer for paginate https://www.npmjs.com/package/mongoose-paginate
            OrganizationModel.paginate(query, { page: Number(page_number), limit: Number(page_size), populate: 'admins' },
                function(err, response) {
                    if (err) {
                        res.send(new ErrorResult('ERROR',apiUtils.i18n('request.failed.msg'),err));
                    } else {
                        res.send(new SuccessResponse('OK', response.docs, response, apiUtils.i18n('request.success.msg')));
                    }
                    res.end();
                });
        }else {
            OrganizationModel.find({},function (err, organizations) {
                if (err) {
                    res.send(new ErrorResult('ERROR', apiUtils.i18n('request.failed.msg'),err));
                } else {
                    res.send(new SuccessResponse('OK', organizations, "", apiUtils.i18n('request.success.msg')));
                }
                res.end();
            })
        }
    },
    add : function(req, res) {
        var queryParams = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;

        //generate organization code if not provided in creation form
        var orgCode = queryParams['code'] && queryParams['code'] !== "" && queryParams['code'] !== null
            ? queryParams['code'] : organizationUtils.generateOrganizationCode(queryParams['name']);

        //check if any organization is already exists with same name
        organizationUtils.isValid(queryParams['name'], queryParams['subDomain']).then(function(isValid){
            console.log('> Adding organization');
            var org = new OrganizationModel({
                _id: new mongoose.Types.ObjectId().toString(),
                name: queryParams['name'],
                subDomain: queryParams['subDomain'],
                sector: queryParams['sector'],
                enabled: true,
                code: orgCode
            });
            org.save(function(error, newOrg){
                if(error){
                    console.log('Error occurred while saving organization: ' + error);
                    res.send(new ErrorResult('FAILED', apiUtils.i18n('org.save.error.msg'),
                        apiUtils.i18n('org.save.error.msg')));
                    return;
                }
                console.log('organization added successfully ');
                //add admin user
                queryParams.user['role'] = ['ROLE_MASTERADMIN'];
                var orgSpecificUrl = apiUtils.getOrganizationSpecificUrl(req, newOrg.subDomain);
                userUtils.add( queryParams.user, newOrg._id, req.app.locals.acl, orgSpecificUrl ).then(function(user) {
                    mailService.sendEmailOnOrgCreation(newOrg, user, orgSpecificUrl);
                    console.log('Mail has been sent successfully');
                    res.send( new SuccessResponse('OK', newOrg, "", apiUtils.i18n('org.save.success.msg')) );
                }, function(error){
                    console.log(error);
                    res.send(new ErrorResult('FAILED', error, error));
                })
            });
        }, function(error){
            console.log(error);
            res.send(new ErrorResult('FAILED', error, error));
        });
    },
    updateStatus : function(req, res) {
        var queryParams = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;

        //check if organization present with id
        organizationUtils.getById(queryParams['id']).then(function(organization){
            organization.enabled = !organization.enabled;
            organization.save(function(err) {
                if (err) {
                    console.log('Error occurred while saving organization: ' + error);
                    res.send(new ErrorResult('FAILED', apiUtils.i18n('org.save.error.msg'),
                        apiUtils.i18n('org.save.error.msg')));
                    return;
                }
                res.send( new SuccessResponse('OK', organization, "", apiUtils.i18n('request.success.msg')) );
            });
        }, function(error) {
            console.log('Organization not found with id ' + queryParams['id']);
            res.send(new ErrorResult('FAILED', 'Organization not found with id ' + queryParams['id'],
                'Organization not found with id ' + queryParams['id']));
        });
    },
    getOrganizationById: function(req, res){
        organizationUtils.getById(req.params.id).then(function(organization){
                res.send( new SuccessResponse('OK', organization, "", apiUtils.i18n('request.success.msg')) )
            },
            function(error){
                res.send(new ErrorResult('FAILED', apiUtils.i18n('org.not.found.error.msg'),
                    apiUtils.i18n('org.not.found.error.msg')))
            })
    },
    addStamp : function(req, res){
        var queryParams = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var stampType = apiUtils.getCompanyStampType(queryParams.type);
        var UploadQuery = apiUtils.prepareUploadStampQuery(stampType, queryParams);
        if(queryParams.stamp){
            OrganizationModel.findOne({_id:req.currentUser.organization}, function(error, result){
                var isTypeExist=false;
                if(result){
                    if(apiUtils.isStampTypeExist(stampType, result)){
                        OrganizationModel.update({_id:req.currentUser.organization,"stamp.type":stampType},
                            { $set: { "stamp.$" : UploadQuery }},
                            function(error, result){
                                if(error){
                                    return res.json(new ErrorResult(500, apiUtils.i18n('Error occurred while uploading stamp'), [error]))
                                }else{
                                    return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')));
                                }
                            })
                    }else{
                        OrganizationModel.update({_id:req.currentUser.organization},
                            { $push : {stamp : UploadQuery}},
                            function(error, result){
                                if(error){
                                    return res.json(new ErrorResult(500, apiUtils.i18n('Error occurred while uploading stamp'), [error]))
                                }else{
                                    return res.json(new SuccessResponse('OK', {}, {}, apiUtils.i18n('request.success.msg')));
                                }
                            })
                    }
                }else{
                    return res.json(new ErrorResult(500, apiUtils.i18n('Error occurred while uploading stamp'), []))
                }

            });
        }else{
            return res.json(new ErrorResult(404, apiUtils.i18n('org.stamp.not.found.error.msg'), []))
        }


    },
    addLogo : function(req, res){
        var queryParams = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        if(queryParams.logo){
            OrganizationModel.update({_id:req.currentUser.organization},
                {
                    logo:{
                        filename:queryParams.logo.filename,
                        filetype:queryParams.logo.filetype,
                        filesize:queryParams.logo.filesize,
                        base64:queryParams.logo.base64
                    }
                },
                function(error, result){
                    if(error){
                        return res.json(new ErrorResult('FAILED', apiUtils.i18n('org.logo.upload.error.msg'), [error]))
                    }else{
                        return res.json(new SuccessResponse('OK', {}, {}, apiUtils.i18n('request.success.msg')));
                    }
                })
        }else{
            return res.json(new ErrorResult('FAILED', apiUtils.i18n('org.logo.not.found.error.msg'), []))
        }


    },
    getOrgSubDomain : function(req, res){
        var query={
            name : req.params.name
        };
        organizationUtils.findOneByQuery(query).then(function(organization){
            if(organization!=null){
                var data={
                    'organization':{
                        'sub-domain':organization.subDomain
                    }
                };
                res.send( new SuccessResponse('OK', data, "", apiUtils.i18n('request.success.msg')) );
            }else{
                res.send(new ErrorResult('FAILED', apiUtils.i18n('org.not.found.with.name.error.msg'),
                    apiUtils.i18n('org.not.found.with.name.error.msg')));
            }

        }, function(error) {
            res.send(new ErrorResult('FAILED', apiUtils.i18n('org.not.found.with.name.error.msg'),
                apiUtils.i18n('org.not.found.with.name.error.msg')));
        });
    },
    downloadStapms:function(req,res){
        var queryParam = (req.query && req.query.q) ?JSON.parse(req.query.q) : req.body.q;
        var authToken = req.headers['auth-token'] ? req.headers['auth-token']: req.query['auth-token'];

        OrganizationModel.findOne({_id:req.currentUser.organization},function (err,org) {
            var img;
            if(org){
                res.writeHead(200, {
                    'Content-Type': queryParam.filetype,
                    "Content-Disposition": queryParam.filename
                });
                if(queryParam.type==='logo'){
                    img = new Buffer(org.logo.base64, 'base64');
                }
                else {
                    org.stamp.forEach(function(eachStamp){
                        if(queryParam.type === eachStamp.type){
                            img = new Buffer(eachStamp.base64, 'base64');
                        }
                    })
                }

                res.end(img);
            }
            else{
                res.send(new ErrorResult('FAILED', apiUtils.i18n('org.not.found.with.name.error.msg'),
                    apiUtils.i18n('org.not.found.with.name.error.msg')));
            }

        });
    },
    deleteStamps:function(req,res){
        var queryParam = (req.query && req.query.q) ?JSON.parse(req.query.q) : req.body.q;
        OrganizationModel.findOne({_id:req.currentUser.organization},function (err,org) {
            if(org){
                if(queryParam.type==='logo'){
                    OrganizationModel.update(
                        { _id:req.currentUser.organization },
                        { $set: {
                            "logo.filename" : '',
                            "logo.filetype" : '',
                            "logo.filesize" : '',
                            "logo.base64" : ''
                        } },function(err,data){
                            if(err){
                                return res.json(new ErrorResult(500, apiUtils.i18n('org.stamp.delete.error.msg'), [err]))
                            }
                            else{
                                return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')));
                            }
                        }
                    )
                }
                else {
                    OrganizationModel.update(
                        { "_id":req.currentUser.organization, "stamp.type": queryParam.type},
                        {
                            "stamp.$.filename" : '',
                            "stamp.$.filetype" : '',
                            "stamp.$.filesize" : '',
                            "stamp.$.base64" : ''
                        } ,function(err,data){
                            if(err){
                                return res.json(new ErrorResult(500, apiUtils.i18n('org.stamp.delete.error.msg'), [err]))
                            }
                            else{
                                return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')));
                            }
                        }
                    )
                }
            }
            else{
                res.send(new ErrorResult('FAILED',  apiUtils.i18n('org.not.found.with.name.error.msg'),
                    apiUtils.i18n('org.not.found.with.name.error.msg')));
            }

        });
    }
};

module.exports=OrganizationRoute;
