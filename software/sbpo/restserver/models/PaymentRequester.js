var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var paymentRequesterSchema = new Schema({
        assignedProject: {
            type : Schema.Types.ObjectId,
            ref: 'Project'
        },
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        organization: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }
    },
    {collection:'paymentRequesters'}
);
paymentRequesterSchema.plugin(mongoosePaginate);
var paymentRequesterModel = mongoose.model('PaymentRequester', paymentRequesterSchema);
module.exports = paymentRequesterModel;
