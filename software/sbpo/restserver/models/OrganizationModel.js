var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var OrganizationSchema = new Schema({
/*        _id: {
            type: String,
            required: true
        },*/
        name:{
            type:String,
            trim:true,
            maxlength:255,
            required: true,
            unique:true
        },
        subDomain:{
            type:String,
            trim:true,
            maxlength:255,
            lowercase: true,
            required: true,
            unique:true
        },
        createdDate:{
            type:Date,
            default: Date.now
        },
        updatedDate: {
            type:Date,
            default: Date.now
        },
        enabled: {
            type:Boolean,
            default:false,
            required: true
        },
        sector: {
            type:String,
            trim:true,
            maxlength:255,
            lowercase: true
        },
        createdBy: {
            type:Schema.Types.ObjectId,
            ref:'User'
        },
        code: {
            type:String,
            trim:true,
            maxlength:255,
            uppercase: true,
            required: true
        },
        admins: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        stamp:[{
            type :  {type:String},
            filename: {type: String},
            filetype:  {type:String},
            filesize: {type:String},
            base64: {type:String}
        }],
        logo:{
            filename: String,
            filetype: String,
            filesize:String,
            base64:String
        }
    },
    {collection:'organizations'}
);

OrganizationSchema.plugin(mongoosePaginate);
var organizationModel = mongoose.model('Organization', OrganizationSchema);
module.exports=organizationModel;
