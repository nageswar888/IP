var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var CounterModel = require('./CounterModel');
var OrganizationModel = require('./OrganizationModel');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;
var adviceSchema = new Schema({
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        payee:{
            type: Schema.Types.ObjectId,
            ref: 'Payee',
            required: true

        },
        adviceNumber:{
            type:String,
            trim:true,
            maxlength:255
        },
        requestedDate:{
            type:Date
        },
        requestedAmount:{
            type:SchemaTypes.Double,
            required: true
        },
        paymentType:{
            type: Schema.Types.ObjectId,
            ref:'CustomField'
        },
        billAmountDue:{
            type:SchemaTypes.Double
        },
        type:{
            type:String
        },
        requestedBy:{
            type:String
        },
        initiatedBy:{
            type:String,
            required: true
        },
        rejectedBy:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        voidedBy:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        description:{
            type:String
        },
        secondLevelApprover:{
            type: Schema.Types.ObjectId,
            ref:'User'
        },
        thirdLevelApprover:{
            type: Schema.Types.ObjectId,
            ref:'User'
        },
        disburser:{
            type:Schema.Types.ObjectId,
            ref:'User'
        },
        disburserDate:{
            type:Date/*,
             default: Date.now*/
        },
        notificationMode:{
            type:String,
            trim:true,
            maxlength:255
        },
        startDate:{
            type:Date,
            default: Date.now
        },
        modifiedDate:{
            type:Date,
            default: Date.now
        },
        endDate:{
            type:Date,
            default: Date.now
        },
        adviceStatus:{
            type:String,
            trim:true,
            maxlength:255
        },
        accountNumber:{
            type:Number
        },
        chequeNumber:{
            type:Number
        },
        creditCardNumber:{
            type:Number
        },
        debitCardNumber:{
            type:Number
        },
        bank:{
            type: Schema.Types.ObjectId,
            ref: 'Bank'
        },
        transactionId:{
            type:String
        },
        others:{
            type:String
        },
        amended:{
            type:Boolean,
            default:false
        },
        expired:{
            type:Boolean,
            default:false
        },
        revisions:[
            {
                startDate: {type:Date},
                modifiedDate: {type:Date},
                adviceNumber: {type:String},
                _id : {
                    type: Schema.Types.ObjectId,
                    ref: 'Advice'
                }
            }
        ],
        version:{
            type:String,
            default: '1.0',
            required: true
        },
        isActive: {
            type:Boolean,
            required: true,
            default: false
        },
        project:{
            type: Schema.Types.ObjectId,
            ref:'Project',
            required: true
        },
        category:{
            type: Schema.Types.ObjectId,
            ref:'CustomField'
        },
        organization: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        seq: {
            type: Number,
            default: 0
        },
        urgent: {
            type:Boolean,
            default:false
        },
        isPaymentRequest:{
            type:Boolean,
            default:false
        },
        paymentRequestId: {
            type: Schema.Types.ObjectId,
            ref: 'PaymentRequest'
        },
        ledger: {
            type: Schema.Types.ObjectId,
            ref: 'VirtualLedger'
        },
        comments:[
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ]
    },
    {collection:'advices', strict: false}
);
adviceSchema.plugin(mongoosePaginate);
adviceSchema.pre('save', function(next) {
    var doc = this;
    CounterModel.findOneAndUpdate(
        {model: 'Advice', organization:doc.organization }, { $inc: { seq: 1 }},
        {
            'new': true,
            'upsert': true
        }
    ).then(function(count) {
            doc.seq = count.seq;
            doc.modifiedDate = new Date();
            //for advice versioning, we need not update advice number, hence if condn
            if (!doc.adviceNumber) {
                OrganizationModel.findById(doc.organization).exec(function (err, organization) {
                    var s = "000000000" + count.seq;
                    doc.adviceNumber = organization.code + '' + s.substr(s.length - 10);
                    next();
                });
            } else {
                next();
            }
        })
        .catch(function(error) {
            console.error("counter error-> : "+error);
            throw error;
        });
});

var adviceModel = mongoose.model('Advice', adviceSchema);
module.exports=adviceModel;

