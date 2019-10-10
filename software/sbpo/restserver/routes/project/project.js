/**
 * Created by sukesh on 7/11/16.
 */
var ProjectModel= require('../../models/ProjectModel');
var errorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var AdviceModel= require('../../models/AdviceModel');
var ProjectNotificationModel= require('../../models/ProjectNotificationModel');
var apiUtils = require('../../utils/apiUtils');
var paymentRequestsModel = require('../../models/PaymentRequestModel');
var paymentRequesterModel = require('../../models/PaymentRequester');
var Q = require('q');
/*var contactsIdsArr=[];*/
/*var contactsIdsArr=[];*/

var ProjectRouter={
    /**
     * Prepare query for list the project
     * @param req
     * @param res
     */
    prepareQuery: function(req, res) {
        var query={};
        query.organization = req.currentUser.organization;
        query.expired = false;
        return query;
    },
    listProjectByName:function(req,res){
        var query= ProjectRouter.prepareQuery(req,res);
        if(req.query.projectName){
            var regExp= new RegExp(req.query.projectName, "i");
            query.projectName=regExp;
        }else if(req.query.projectName===''){
            query.projectName='';
        }
        var aggQuery = apiUtils.prepareFetchByNameAggregateQuery(query,'projectName');

        ProjectModel.aggregate(aggQuery
            ,function(err,project){
                if(project){
                    res.send(new SuccessResponse('OK', project, "", apiUtils.i18n('request.success.msg')));
                }
                if(err){
                    res.send(new errorResult('ERROR',apiUtils.i18n('request.failed.msg'),err));
                }
            })

    },

    listAllProject: function(req,res){
        //only for pagination
        if(req.query.page) {
            var page_number =req.query.page ? req.query.page:1;
            var page_size = req.query.page_size ? req.query.page_size : 10 ;
            var query= ProjectRouter.prepareQuery(req,res);
            if(req.query.projectName){
                var regExp= new RegExp(req.query.projectName, "i");
                query.projectName=regExp;
            }if(req.query.projectLocation){
                var regExp= new RegExp(req.query.projectLocation, "i");
                query.projectLocation=regExp;
            }
            // Refer for paginate https://www.npmjs.com/package/mongoose-paginate
            ProjectModel.paginate(query, { page: Number(page_number), limit: Number(page_size) ,populate: 'contacts', }, function(err, response) {
                if (err) {
                    res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'), err));
                } else {
                    res.send(new SuccessResponse('OK', response.docs, response, apiUtils.i18n('request.success.msg')));
                    res.end();
                }
            });
        }else {
            var query= ProjectRouter.prepareQuery(req,res);
            ProjectModel.find(query,function (err, project) {
                if (err) {
                    res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),error));
                } else {
                    res.send(new SuccessResponse('OK', project, "", apiUtils.i18n('request.success.msg')));
                    res.end();
                }
            })
        }
    },
    getProjectCount: function(req, res) {
        var query= ProjectRouter.prepareQuery(req,res);
        var aggregateQuery = apiUtils.prepareCountAggregationQueryForAdmin(query);

        if (apiUtils.isEmptyObject(aggregateQuery)) {
            res.json({data:"empty"})
        }
        else {
            ProjectModel.aggregate(aggregateQuery,function(error,result){
                if(result){
                    console.log("result",result)
                    res.send( new SuccessResponse(200, result, "", apiUtils.i18n('request.success.msg')) );
                }
                if(error){
                    res.send(new errorResult(500, apiUtils.i18n('project.count.error.msg')));
                }
            });
        }

    },
    deleteProject:function(req,res){
        queryParam=req.params;
        AdviceModel.findOne({'project': req.params.id}, function (err, advice) {
            if(advice){
                return res.json(new errorResult(400, apiUtils.i18n('project.delete.contains.advice.error.msg'), [err]))
            }else{
                paymentRequestsModel.findOne({'project': req.params.id}, function (err, paymentRequest) {
                    if(paymentRequest){
                        return res.json(new errorResult(400, apiUtils.i18n('project.delete.contains.paymentRequest.error.msg'), [err]))
                    }else{
                        paymentRequesterModel.findOne({'assignedProject' : req.params.id},function(err,paymentRequester){
                            if(paymentRequester){
                                return res.json(new errorResult(400, apiUtils.i18n('project.delete.contains.paymentRequester.error.msg'), [err]))
                            }else{
                                ProjectModel.update({_id:queryParam.id},
                                    {
                                        expired: true
                                    },
                                    function(error, result) {
                                        if (error) {
                                            return res.json(new errorResult(400, apiUtils.i18n('project.delete.error.msg'), [error]))
                                        }
                                        else{
                                            return res.json(new SuccessResponse(200, {}, {}, apiUtils.i18n('request.success.msg')));
                                        }
                                    });
                            }
                        })
                    }
                });
            }
        });
    },
    editProject:function(req,res){
        queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;

        addAndUpdatesProjectContacts(queryParam.editedContacts,req).then(function(contactsIdsArr){

            var projectNameRegex = new RegExp('^'+queryParam.projectName+'$', "i");
            ProjectModel.count({projectName:projectNameRegex,_id:{$ne:queryParam.id}, expired: false, organization: req.currentUser.organization},function(error, count){
                if(count == 0){
                    ProjectModel.update(
                        { _id: queryParam.id },
                        {
                            projectName:queryParam.projectName,
                            projectLocation:queryParam.projectLocation,
                            startDate:queryParam.startDate,
                            endDate:queryParam.endDate,
                            organization : req.currentUser.organization,
                            contacts:contactsIdsArr
                        },
                        { upsert: true },function(error,data){
                            if(error){
                                res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),error));
                            }
                            else {
                                res.send( new SuccessResponse('OK', data, "", apiUtils.i18n('request.success.msg')) );
                            }
                        }
                    );
                }else{
                    res.send(new errorResult('ERROR', apiUtils.i18n('project.exists.error.msg'),error));
                }
            });
        }).catch(function(err){
            console.log("Error here",err);
            /*res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),error));*/
            res.send(new errorResult(301, apiUtils.i18n('contact.exist'),err));
        })
    },
    saveProject: function(req,res){
        queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        addAndUpdatesProjectContacts(queryParam.contacts,req).then(function(contactsIdsArr){
            var projectNameRegex = new RegExp('^'+queryParam.projectname+'$', "i");
            ProjectModel.count({projectName:projectNameRegex, organization:req.currentUser.organization, expired:false},function(err, count){
                if(count == 0){
                    new ProjectModel({
                        projectName:queryParam.projectname,
                        projectLocation:queryParam.projectlocation,
                        startDate:queryParam.startdate,
                        endDate:queryParam.enddate,
                        organization : req.currentUser.organization,
                        contacts:contactsIdsArr
                    }).save(function(error,newProject){
                        if(error){
                            res.send(err);
                        }else{
                            res.send( new SuccessResponse('OK', newProject, "",  apiUtils.i18n('request.success.msg')) );
                        }
                    });
                }
                else{
                    res.send(new errorResult('ERROR', apiUtils.i18n('project.exists.error.msg'),err));
                }
            })
        });
    }
};
module.exports=ProjectRouter;

/**
 *
 * @param contactList
 * @param req
 * @returns {*|promise}
 *
 * This method will add and update the contacts to the respected project.
 */
function addAndUpdatesProjectContacts(contactList,req){
    var deferred = Q.defer();

    if(removeDuplicates(contactList,'contact')){
        deferred.reject("duplicate");
    }
    else {
        var promisesList = [];
        if(contactList.length>0){
            contactList.forEach(function(eachContact,index){
                if(!eachContact._id){
                    promisesList.push(createProjectNotification(eachContact,req));
                }
                else {
                    promisesList.push(updateProjectNotification(eachContact))
                }
            });
            Q.allSettled( promisesList ).then(function (resp) {
                var contactsList=[];
                resp.forEach(function(contact){
                    contactsList.push(contact.value);
                });
                deferred.resolve(contactsList);
            });
        }
        else {
            deferred.resolve([]);
        }
    }


    return deferred.promise;
}

/**
 *
 * @param eachContact
 *
 * Method will add contacts to respected project
 */
function createProjectNotification(eachContact,req){
    var deferred= Q.defer();
    new ProjectNotificationModel({
        contact:eachContact.contact,
        type:eachContact.type,
        organization:req.currentUser.organization
    }).save(function(err,data){
        if(err){
            deferred.reject(err);
            console.log("Error",err);
        }
        else {
            deferred.resolve(data._id);
        }
    });
    return deferred.promise;
}

/**
 *
 * @param eachContact
 * Method will update contacts to respected project
 *
 */
function updateProjectNotification(eachContact){
    var deferred= Q.defer();
    ProjectNotificationModel.findOneAndUpdate({_id:eachContact._id},
        {
            contact: eachContact.contact
        },
        { upsert: true }
        ,function(err,data){
            if(err){
                deferred.reject(err);
                console.log("Error :",err);
            }
            else {
                deferred.resolve(data._id);
            }
        });
    return deferred.promise;
}
/**
 *
 * @param arr
 * @param prop
 * @returns {Array}
 *
 * This method will return true if duplicates contacts will found
 */
function removeDuplicates(arr, prop) {
    var duplicateFound = false;
    var lookup  = {};
    var count=0;

    for (var i in arr) {
        lookup[arr[i][prop]] = arr[i];
    }

    for (i in lookup) {
        count++;
    }

    if(arr.length>count){
        duplicateFound=true;
    }
    return duplicateFound;
}
