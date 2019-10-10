/**
 * Created by semanticbits on 26/10/16.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var projectSchema = new Schema({
        projectName:{
            type:String,
            trim:true,
            required: true
        },
        projectLocation:{
            type:String,
            trim:true,
            required: true
        },
        startDate:{
            type:Date,
            required: true
        },
        endDate:{
            type:Date
        },
        expired:{
            type:Boolean,
            default:false
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        contacts:[
            {
                type: Schema.Types.ObjectId,
                ref: 'ProjectNotifications'
            }
        ]
    },
    {collection:'projects'}
);
projectSchema.plugin(mongoosePaginate);
var projectModel = mongoose.model('Project', projectSchema);
module.exports=projectModel;
