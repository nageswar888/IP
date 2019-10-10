var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CounterSchema = new mongoose.Schema({
    seq: {
        type: Number,
        default: 0
    },
    model: {
        type: String,
        required: true
    },
    organization:{
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
},
    {collection:'counters', strict: false}
);
CounterSchema.index({model: 1, organization: 1}, {unique: true});
var counterModel = mongoose.model('Counter', CounterSchema);
module.exports=counterModel;
