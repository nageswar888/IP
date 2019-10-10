/**
 * Created by sukesh on 4/11/16.
 */
var CommentModel=require('../../models/CommentModel');
var SuccessResponse = require('../../models/SuccessResponse');
var shadedResponse = require('../../utils/shadedResponse');
var AdviceModel= require('../../models/AdviceModel');
var apiUtils = require('../../utils/apiUtils');
var paymentRequestModel= require('../../models/PaymentRequestModel');
var ErrorResult=require('../../models/ErrorResult')
var commentRouter={
    addComment:function(req,res){
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        if(!queryParam.text){
            res.send(new ErrorResult('FAILED','Failed to save','Comment is required'));
            res.end();
        }
        else {
            var comment = new CommentModel({
                text: queryParam.text,
                user: queryParam.userId,
                createdDate: queryParam.date,
                organization: req.currentUser.organization
            });
            comment.save(function (err, comment) {
                if (err) {
                    res.send(err);
                }
                else {
                    AdviceModel.update({"_id": queryParam.adviceId}, {"$addToSet": {comments: comment._id}}, function (error, advice) {
                        if (error) {
                            console.log("Failed to save comment Id: " + comment._id + " in advice: " + queryParam.adviceId);
                            return res.send(error);
                        } else if (comment.text) {
                            res.send(new SuccessResponse('OK', comment, "", apiUtils.i18n("request.success.msg")));
                        }
                    });
                }
            })
        }

    },
    getCommentsByAdviceId: function(req,res){
        var queryParam = (req.query && req.query.q) ?  JSON.parse(req.query.q) :  req.body.q;
        AdviceModel
            .findOne({ '_id': queryParam.adviceId, 'organization': req.currentUser.organization },{"comments":1})
            .populate({path:'comments', populate:{ path: 'user', select:'firstName middleName lastName'}, options:{ sort:{'createdDate':-1}}})
            .exec(function (error, advices) {
                if (error) { res.send(error); }
                else {
                    res.send( new SuccessResponse('OK', advices.comments, "", apiUtils.i18n("request.success.msg")) );
                    res.end();
                }
            });
    }

};
module.exports=commentRouter;
