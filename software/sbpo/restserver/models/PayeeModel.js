var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var CounterModel = require('./CounterModel');
var Schema = mongoose.Schema;
var payeeSchema = new Schema({

        bankName:{
            type:String
        },
        ifscCode:{
            type:String
        },
        bankBranch:{
            type:String
        },
        accountNumber:{
            type:String
        },
        expired:{
            type:Boolean,
            default:false
        },
        payeeNumber: {
            type:Number
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        nickName: {
            type:String,
            required: true
        }

    },
    {collection:'payees'}
);
payeeSchema.plugin(mongoosePaginate);
payeeSchema.pre('save', function(next) {
    var doc = this;
    CounterModel.findOneAndUpdate({model:'Payee', organization:doc.organization}, {$inc:{seq:1}}, {'new': true, 'upsert': true})
        .then(function(count) {
            doc.payeeNumber = count.seq;
            next();
        })
        .catch(function(error) {
            console.error("Error while incrementing seq number for payee : "+error);
            throw error;
        });
});
var payeeModel = mongoose.model('Payee', payeeSchema);
module.exports=payeeModel;
