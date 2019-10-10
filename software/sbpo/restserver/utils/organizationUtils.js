var Q = require('q');
var constants = require("./constants");
var OrganizationModel= require('../models/OrganizationModel');
var apiUtils= require('./apiUtils');

var organizationUtils = {

    isValid : function ( orgName, orgSubDomain ) {
        var deferred = Q.defer();
        var namePromise = organizationUtils.getCountByQuery( { name: new RegExp(orgName , "i")});
        var codePromise = organizationUtils.getCountByQuery( { subDomain: new RegExp(orgSubDomain , "i")});
        Q.allSettled( [namePromise, codePromise] ).then(function (resp) {
            if (resp[0].value === 0 && resp[1].value === 0 ){
                deferred.resolve(true);
            } else if (resp[0].value !== 0) {
                deferred.reject(apiUtils.i18n('org.exists.error.msg'));
            } else {
                deferred.reject(apiUtils.i18n('org.sub.domain.exists.error.msg'));
            }
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    },
    getById : function ( orgId ) {
        var deferred = Q.defer();
        OrganizationModel.findById(orgId).exec(function(err, organization){
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(organization);
            }
        });
        return deferred.promise;
    },
    getCountByQuery: function(query) {
        var deferred = Q.defer();
        OrganizationModel.count(query).exec(function(err, count){
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    },
    findOneByQuery: function(query) {
        var deferred = Q.defer();
        OrganizationModel.findOne(query).exec(function(err, organization){
            if (!organization) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(organization);
            }
        });
        return deferred.promise;
    },
    generateOrganizationCode: function(orgName) {
        var orgSubString = orgName.substring(0,3);
        var date = new Date();
        var monthName = apiUtils.getFullMonth(date.getMonth());
        var dayName = apiUtils.getFullDay(date.getDay());
        var currentDate = date.getDate();
        return ''+orgSubString.toUpperCase()+''+monthName.substring(0,1)+''+currentDate+dayName.substring(0,1);
    },
    addAdminUser: function(orgId, userId) {
        var deferred = Q.defer();
        organizationUtils.getById(orgId).then(function(organization){
            //organization.admins.push(userId);
            organization.admins = [userId];
            organization.save(function(err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                deferred.resolve(organization);
            });
        }, function(error) {
            deferred.reject(error);
        })
        return deferred.promise;
    }
};
module.exports = organizationUtils;
