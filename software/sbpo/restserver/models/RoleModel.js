var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var roleSchema = new Schema({
        name:{
            type:String,
            trim:true
        },
        privileges:[{
            type: Schema.Types.ObjectId,
            ref: 'Privilege'
        }]
    },
    {collection:'roles'});

roleSchema.plugin(mongoosePaginate);
var roleModel = mongoose.model('Role', roleSchema);
module.exports=roleModel;
