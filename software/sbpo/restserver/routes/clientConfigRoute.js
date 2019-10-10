/**
 * Created by semanticbits on 19/10/16.
 */
var SuccessResponse = require('../models/SuccessResponse');
var apiUtil=require('../utils/apiUtils');

var auth={
    getConfig:function(req,res){
        var config = require('../config/client/' + req.app.settings.env);
        return res.json(new SuccessResponse('OK', config, {}, apiUtil.i18n('request.success.msg')))
    }
};
module.exports = auth;
