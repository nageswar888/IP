var mongodb = require('mongodb');

exports.up = function(db, next){
    var organizations = db.collection('organizations');
    organizations.findOne({name:"DCL"},function(err,organization){
        console.log('Migrating all domains organizationId with ', organization._id);
        var advices = db.collection('advices');
        advices.find({}).forEach(function (advice, index) {
            advice.organization = organization._id;
            advices.update({_id: advice._id},{ $set: {"organization" : organization._id, modifiedDate: advice.startDate}},
                {multi:true});
        });

        var attachments = db.collection('attachments');
        attachments.find({}).forEach(function (attachment, index) {
            attachment.organization = organization._id;
            attachments.update({_id: attachment._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        var banks = db.collection('banks');
        banks.find({}).forEach(function (bank, index) {
            bank.organization = organization._id;
            banks.update({_id: bank._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        var comments = db.collection('comments');
        comments.find({}).forEach(function (comment, index) {
            comment.organization = organization._id;
            comments.update({_id: comment._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        var feedbacks = db.collection('feedbacks');
        feedbacks.find({}).forEach(function (feedback, index) {
            feedback.organization = organization._id;
            feedbacks.update({_id: feedback._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        var payees = db.collection('payees');
        payees.find({}).forEach(function (payee, index) {
            payee.organization = organization._id;
            payees.update({_id: payee._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        var projects = db.collection('projects');
        projects.find({}).forEach(function (project, index) {
            project.organization = organization._id;
            projects.update({_id: project._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        var users = db.collection('users');
        users.find({}).forEach(function (user, index) {
            user.organization = organization._id;
            users.update({_id: user._id},{ $set: {"organization" : organization._id}},{multi:true});
        });

        //Removing the users table tenantId field from all documents.
        db.collection('users').update({}, { $unset: { tenantId: ""} });
        console.log('Migration completed for all domains');
        next();
    });
};

exports.down = function(db, next){
    next();
};
