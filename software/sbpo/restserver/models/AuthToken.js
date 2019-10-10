var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var tokenSchema = new Schema({
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        authToken:String
    },
    {collection:'tokens'}
);
tokenSchema.methods.update = function update(callback) {
    console.log('--Updating the token from model...',this);
    return this.model('Token').update(
        { _id: this._id }, this, { upsert: true },callback);
};

var tokenModel = mongoose.model('Token', tokenSchema);
module.exports=tokenModel;
