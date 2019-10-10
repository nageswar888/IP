/**
 * Created by sukesh on 3/11/16.
 */
var SuccessResponse = require('../../models/SuccessResponse');
var apiUtils = require('../../utils/apiUtils');
var RoleModel = require('../../models/RoleModel');

var role = {
    listRoles : function(req, res) {
        var query = { name: { $nin: ["ROLE_IPASS_MASTERADMIN" ] }};
        if(req.query.except) {
            query.name['$nin'].push(req.query.except);
        }
        RoleModel.find(query, function(err, docs) {
            if (!err){
                res.status(200);
                return res.json(new SuccessResponse('OK', docs, {}, apiUtils.i18n('request.success.msg')))
            } else {throw err;}
        });
    }
};

module.exports = role;
