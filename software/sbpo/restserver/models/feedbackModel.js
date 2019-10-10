var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var feedbackSchema = new Schema({
        reportedBy:{
            type:String
        },
        feedbackStatus:{
            type:String
        },
        title:{
            type:String
        },
        description:{
            type: String
        },
        organization:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        }

    },
    {collection:'feedbacks'}
);
feedbackSchema.plugin(mongoosePaginate);
var feedbackModel = mongoose.model('Feedback', feedbackSchema);
module.exports=feedbackModel;

