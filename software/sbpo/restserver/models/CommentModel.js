var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var commentSchema = new Schema({
        text:{
            type:String,
            trim:true
        },
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        createdDate:{
            type:Date,
            default: Date.now
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }
    },
    {collection:'comments'}
);
var commentModel = mongoose.model('Comment', commentSchema);
module.exports=commentModel;
