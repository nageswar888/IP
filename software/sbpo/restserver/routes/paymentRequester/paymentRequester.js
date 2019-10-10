var PaymentRequesterModel= require('../../models/PaymentRequester');
var apiUtils= require('../../utils/apiUtils');
var errorResult = require('../../models/ErrorResult');
var SuccessResponse = require('../../models/SuccessResponse');
var paymentRequesterRouter={
    listProjectsByPaymentRequester: function(req, res){
        var queryParam = req.query.q;
        var populate={path:'assignedProject',select:'projectName'};
        PaymentRequesterModel.findOne({user:queryParam}).populate(populate).exec(function (err, user) {
            if (err) {
                res.send(new errorResult('ERROR', "failed",error));

            } else {
                if(user) {
                    var assignedProject=user.assignedProject;
                }
                res.send(new SuccessResponse('OK', assignedProject, "", apiUtils.i18n('request.success.msg')));
                res.end();
            }
        })
    },
    listProjectByUserId: function(req, res){
        var queryParam = (req.query && req.query.q) ? JSON.parse(req.query.q) : req.body.q;
        var populate={path:'assignedProject',select:'projectName'};
        PaymentRequesterModel.findOne(queryParam).populate(populate).exec(function (err, user) {
            if (err) {
                res.send(new errorResult('ERROR', apiUtils.i18n('request.failed.msg'),err));

            } else {
                if(user) {
                    var assignedProject=user.assignedProject;
                }
                res.send(new SuccessResponse('OK', assignedProject, "", apiUtils.i18n('request.success.msg')));
                res.end();
            }
        })
    }
};
module.exports=paymentRequesterRouter;
