var mongodb = require('mongodb');

exports.up = function(db, next){
    var tokens = db.collection('tokens');
    var tokensCount = 0, i=1;
    tokens.count({}).then(function (count) {
        tokensCount=count;
        if (count>0) {
            tokens.find({}).forEach(function (token) {
                console.log('Migrating the auth-token: ', token._id);
                var users = db.collection('users');
                users.findOne({email: token.email},function(err,user){
                    if(!err && user) {
                        token.user = user._id;
                        tokens.update({_id: token._id},{ $set: token},{multi:true});
                        console.log('Migrated the auth-token: ', token);
                    } else {
                        console.log('User not found, so deleting the current token :', token._id);
                        tokens.remove({_id: token._id});
                    }
                    if(i===tokensCount) {
                        //Removing the email from tokens table
                        tokens.update({}, { $unset: { email: ""} },{multi:true});
                        console.log('Migrated all auth-tokens');
                        next();
                    }
                    i++;
                });
            });
        } else {
            next();
        }
    });
};

exports.down = function(db, next){
    next();
};
