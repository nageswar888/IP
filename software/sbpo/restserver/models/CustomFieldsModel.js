var mongoose = require('mongoose');
var Q = require('q');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var customFieldSchema = new Schema({
        name:{
            type:String,
            trim:true,
            required: true

        },
        description:{
            type:String,
            required: false
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        type:{
            type:String,
            required: true
        }

    },
    {collection:'customFields'}
);
customFieldSchema.plugin(mongoosePaginate);
var customFieldModel = mongoose.model('CustomField', customFieldSchema);
module.exports=customFieldModel;




