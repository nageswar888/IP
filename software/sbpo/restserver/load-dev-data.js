var defaultUsers = require("./bootstrap/default-data-loader");
var app = require('./server');
//TODO: Replace this timeout with "promise"
setTimeout(function(){
    defaultUsers.storingDefaultValues(app,'dev').then(function (resp) {
        console.log('successfully Stored Default organizations and users');
        process.exit();
    }, function(error) {
        console.log('Failed to Store Default organizations and users');
        process.exit();
    });
}, 1000);