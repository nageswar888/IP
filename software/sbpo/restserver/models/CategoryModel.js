/**
 * Created by sukesh on 25/1/17.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var categoriesSchema = new Schema({
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
    {collection:'categories'}
);
categoriesSchema.plugin(mongoosePaginate);
var categoriesModel = mongoose.model('Category', categoriesSchema);
module.exports=categoriesModel;
