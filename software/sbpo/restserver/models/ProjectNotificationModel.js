/**
 * Created by sb0103 on 17/1/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var projectNotificationSchema = new Schema({
        contact:{
            type:String,
            lowercase: true
        },
        type:{
            type:String
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }
    },
    {collection:'ProjectNotifications'}
);
var projectNotificationModel = mongoose.model('ProjectNotifications', projectNotificationSchema);
module.exports=projectNotificationModel;
