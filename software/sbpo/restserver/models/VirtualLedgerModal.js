/**
 * Created by praveen on 3/21/17.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var virtualLedgerSchema = new Schema({
        name:{
            type:String,
            trim:true,
            required: true
        },
        organization:{
            type:Schema.Types.ObjectId,
            ref:'Organization',
            required:true
        },
        payees:[
            {
                type:Schema.Types.ObjectId,
                ref:"Payee"
            }
        ],
        discriminator:{
            type:String,
            trim:true,
            required: true
        }
}, {collection:'virtualLedgers'});


virtualLedgerSchema.plugin(mongoosePaginate);
virtualLedgerSchema.pre('save', function(next) {
    var doc = this;
    /*TODO:Remove the hard coded values*/
    if(doc.discriminator == 'virtualLedger') {
        if(!doc.payees) {
            console.error("Payee is mandatory for virtual ledger ");
            throw error;
        } else { next(); }
    } else { next(); }
});
var virtualLedgerModal = mongoose.model('VirtualLedger', virtualLedgerSchema);
module.exports = virtualLedgerModal;