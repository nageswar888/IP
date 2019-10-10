var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var CounterModel = require('./CounterModel');
var constants = require('../utils/constants');

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;
var paymentRequestSchema = new Schema({
        payee:{
            type: Schema.Types.ObjectId,
            ref: 'Payee',
            required: true
        },
        requestedUser:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount:{
            type:SchemaTypes.Double,
            required: true
        },
        paymentType:{
            type: Schema.Types.ObjectId,
            ref:'CustomField'
        },
        status: {
            type:String,
            trim:true,
            maxlength:255,
            required: true
        },
        purpose: {
            type:String,
            trim:true,
            maxlength:255
        },
        project:{
            type: Schema.Types.ObjectId,
            ref:'Project',
            required: true
        },
        organization: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        createdDate:{
            type:Date,
            default: Date.now
        },
        //when payment request process/rejected, this should be updated
        updatedBy:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        pr_seq: {
            type: Number,
            default: 0
        },
        paymentRequestNumber:{
            type:String,
            trim:true,
            maxlength:255
        },
        comments:[
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ]
    },
    {collection:'paymentRequests', strict: false}
);

paymentRequestSchema.pre('save', function(next) {
    var doc = this;
    CounterModel.findOneAndUpdate(
        {model: 'PaymentRequest', organization:doc.organization }, { $inc: { seq: 1 }},
        {
            'new': true,
            'upsert': true
        }
    ).then(function(count) {
        doc.pr_seq = count.seq;
        var s = "000000000" + count.seq;
        doc.paymentRequestNumber = constants.PAYMENT_REQUEST_PRECODE+s.substr(s.length-10);
        next();
    }).catch(function(error) {
        console.error("counter error-> : "+error);
        throw error;
    });
});

var paymentRequestModel = mongoose.model('PaymentRequest', paymentRequestSchema);
module.exports = paymentRequestModel;