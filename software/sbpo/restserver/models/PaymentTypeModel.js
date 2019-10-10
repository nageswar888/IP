var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var paymentTypeSchema = new Schema({
        name:{
            type:String,
            trim:true,
            required: true,
            unique:true
        },
        key:{
            type:String
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        description:{
            type:String
        }

    },
    {collection:'paymenttypes'}
);
paymentTypeSchema.plugin(mongoosePaginate);
var paymentTypeModel = mongoose.model('PaymentType', paymentTypeSchema);
module.exports=paymentTypeModel;
