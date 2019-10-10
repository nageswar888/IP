
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var attachmentSchema = new Schema({
        advice:{
            type: Schema.Types.ObjectId,
            ref: 'Advice'
        },
        name:{
            type:String,
            trim:true
        },
        data:{
            type:String
        },
        createdAt:{
            type:Date
        },
        updatedAt:{
            type:Date
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }
    },
    {collection:'attachments'}
);
var attachmentModel = mongoose.model('Attachment', attachmentSchema);
module.exports=attachmentModel;
