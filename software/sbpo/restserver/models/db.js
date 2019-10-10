
var mongoose = require('mongoose');
var Q = require('q');

var DBConnection = function(app, conf) {
    var deferred = Q.defer();
    mongoose.set('debug', true);
// CONNECTION EVENTS
    mongoose.connect(conf.db.url);

// When successfully connected
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + conf.db.url);
        deferred.resolve();
    });

// If the connection throws an error
    mongoose.connection.on('error',function (err) {
        console.log('Mongoose default connection error: ' + err);
        process.exit(1);
    });

// When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected');
    });

// If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });
    return deferred.promise;
};

module.exports = DBConnection;
