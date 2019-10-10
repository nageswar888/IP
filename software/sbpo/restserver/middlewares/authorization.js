var jwt = require('jwt-simple');
var UserModel = require('../models/UserModel');
var AuthToken = require('../models/AuthToken');
var secret = require('../config/secret.js')();
var resourceMappings = require('../acl/resourceMappings');
var RoutePattern = require('route-pattern');
var logger = require('../config/logging');
var apiUtils = require('../utils/apiUtils');

function harmonizeUrl(req) {

    var url = req.originalUrl.split('?')[0];
    var parts = url.split('/');
    if (isHex(parts[parts.length -1])) {
        url = parts.slice(0, parts.length - 1).join('/');
    }
    var resource = '';
    /*TODO:------Remove resourceMappings dependency from here------ */
    resourceMappings.forEach(function(mapping) {
        if(mapping.resource === url || RoutePattern.PathPattern.fromString(mapping.resource).matches(url)) {
            if(resource.length < mapping.resource.length) {
                resource = mapping.resource;
            }
        }
    });
    logger.debug("authorization - [harmonized resource for url = %s , resource : : %s]",
        req.originalUrl.split('?')[0],
        resource);
    return resource;

}

function isHex(str) {
    if (/[^a-fA-F0-9]/.test(str)) {
        return false;
    }
    return true;
}

function verifyRequest(req, acl, cb) {
    logger.debug("authorization - [url = %s]", req.originalUrl.split('?')[0]);
    var token, key, tokenObj;
    /*tokenObj = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;*/
    token = req.headers['auth-token'];
    token = token ? token : req.query["auth-token"];
        //request has token ?
    if(!token) {
        // console.log("authorization - Invalid token12334");
        logger.debug("authorization - Invalid token");
        cb({"status": 401, "message": "Invalid Token" });
        console.log("authorization - Invalid token");
        return;
    }

    //is expired ?
    var decoded = jwt.decode(token, secret);
    if (new Date(decoded.exp) <= Date.now()) {
        logger.debug("authorization - Token expired");
        cb({  "status": 400, "message": "Token Expired"   });
        console.log(" Token expired");
        return;
    }

    AuthToken.findOne({'authToken': token}, function (err, token) {
        if (err) {
            console.log(err);
        } else {
         if(token===null){
             cb({"status": 404, "message": "Token not found"});
         }
            else{
             UserModel.findById(token.user, function (err, user) {
                 if(!user) {
                     logger.debug("authorization - Invalid user");
                     cb({"status": 401, "message": "Invalid user" });
                     console.log(" authorization - Invalid user");
                     return;
                 }

                 //is disabled ?
                 if(user.enabled === false && user.first_time_login===false) {
                     logger.debug("authorization - User account is deactivated");
                     cb({"status": 403, "message": 'User account blocked'});
                     console.log("authorization - User account is deactivated");

                     return;
                 }


                 reqUrl = harmonizeUrl(req);


                 if(!reqUrl) {
                     logger.debug("authorization - Harmonized url is not found in mapping");
                     cb({"status": 403, "message": 'Resource URL is not mapped correctly'});
                     console.log("uthorization - Harmonized url is not found in mapping");
                     return;
                 }

                 requestor = user._id.toString();
                 req.currentUser = user;
                 req.serverUrl = apiUtils.getServerUrl(req);
                 reqMethod = req.method.toLowerCase();

                 logger.debug("authorization - ACL check[email: %s, requestor : %s, method : %s , url = %s]", user.email, requestor, reqMethod, reqUrl);
                 acl.isAllowed(requestor, reqUrl, reqMethod, function(err, allowed){
                     if(err) {
                         logger.debug("authorization - User [%s] known to ACL", user.email);
                         cb({"status": 401, "message": 'User not authenticated'});
                     } else if(!allowed) {
                         logger.debug("authorization - Insufficient permission");
                         cb({"status": 403, "message": 'Insufficient permissions to access resource'});
                     } else {
                         req.currentUser = user;
                         logger.info("authorization - ALLOWED [email: %s, requestor : %s, method : %s , url = %s]", user.email, requestor, reqMethod, reqUrl);
                         cb({"status" : 200, "message" : 'OK'});
                     }
                 });
             });
         }
        }
    });
}


module.exports = function (acl) {

    return function (req, res, next) {
        try{
            verifyRequest(req, acl, function (result) {
                if(result.status === 200) {
                    next();
                    return;
                } else {
                    res.status(result.status);
                    res.json(result);
                    return;
                }
            });
        }catch(err) {
            logger.warn("Unexpected error in authorization middleware", err);
            res.status(500);
            res.json({
                "status": 500,
                "message": "Oops!! something went wrong",
                "error": err.toString()
            });
        }


    };
}

