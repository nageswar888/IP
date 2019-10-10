var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var userSchema = new Schema({
        firstName:{
            type:String,
            trim:true,
            required: true
        },
        lastName:{
            type:String,
            trim:true
        },
        middleName:{
            type:String,
            trim:true
        },
        email:{
            type: String,
            trim:true,
            lowercase: true,
            required: true
        },
        phoneNumber:{
            type:String
        },
        password:{
            type: String,
            trim:true
        },
        roles:[{
            type:String,
            ref:"Role",
            required: true
        }],
        userId:{
            type:Number
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        signature:{
            filename: String,
            filetype: String,
            filesize:String,
            base64:String
        },
        passcode:{
            type:String
        },
        enabled: {
            type:Boolean,
            default:false
        },
        passwordToken:String,
        authToken:String,
        first_time_login:Boolean
    },
    {collection:'users'}
);
userSchema.plugin(mongoosePaginate);
var userModel = mongoose.model('User', userSchema);
module.exports=userModel;
