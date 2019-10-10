//TODO: Please use this file to run the generic migration
/*This file can be used by injecting the script "migrate-prod": "node run-migration.js" in package.json file
And every time when the project version is upgraded, please run the npm migrate project version.
Follow: https://docs.npmjs.com/cli/version*/

//TODO: If we run this js file then please include "child_process": "^1.0.2", plugin and uncomment below line
// var exec = require('child_process').exec;
var pjson = require('./package.json');

var command = 'node node_modules/mongodb-migrate -runmm -cfg config/migration-config.json -dbn dbSettings -c migrations/v'+pjson.version+'/prod/';
var workerProcess = exec(command,function
    (error, stdout, stderr) {

    if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
});

workerProcess.on('exit', function (code) {
    console.log('Child process exited with exit code '+code);
});