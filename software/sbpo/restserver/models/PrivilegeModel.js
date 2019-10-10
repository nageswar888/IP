/**
 * Created by Ashish on 13/4/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var privilegeSchema = new Schema({
        code:{
            type:String,
            required: true
        },
        displayName:{
            type:String,
            required: false
        }
    },
    {collection:'privileges'}
);
privilegeSchema.plugin(mongoosePaginate);
var privilegeModel = mongoose.model('Privilege', privilegeSchema);
module.exports=privilegeModel;

