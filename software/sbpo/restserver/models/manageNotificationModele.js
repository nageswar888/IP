/**
 * Created by sb0103 on 18/1/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var manageNotificationSchema = new Schema({
        type:{
            type:String
        },
        is_email:{
            type:Boolean
        },
        is_phone:{
            type:Boolean
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }
    },
    {collection:'ManageNotification'}
);
var payeeModel = mongoose.model('ManageNotification', manageNotificationSchema);
module.exports=payeeModel;
