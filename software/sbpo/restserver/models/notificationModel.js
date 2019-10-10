/**
 * Created by sb0103 on 17/1/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var notificationSchema = new Schema({
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
    {collection:'notifications'}
);
var payeeModel = mongoose.model('Notification', notificationSchema);
module.exports=payeeModel;
