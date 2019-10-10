/**
 * Created by sukesh on 3/11/16.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var bankSchema = new Schema({

        accountName:{
            type:String,
            trim:true,
            required: true
        },
        accountNo:{
            type:String
        },
        bankName:{
            type:String,
            trim:true
        },
        branchName:{
            type:String,
            trim:true
        },
        ifscCode:{
            type:String
        },
        address:{
            type:String
        },
        accountType:{
         type:String,
         trim:true,
         required: true

         },
        creditCardNumber:{
            type:String
        },
        debitCardNumber:{
            type:String
        },
        openingBalance:{
            type: Schema.Types.Double,
            required: true

        },
        asOf:{
            type:Date,
            required: true
        },
        expired:{
            type:Boolean,
            default:false
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }

    },
    {collection:'banks'}
);
bankSchema.plugin(mongoosePaginate);
var bankModel = mongoose.model('Bank', bankSchema);
module.exports=bankModel;
