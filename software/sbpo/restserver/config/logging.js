var bunyan = require('bunyan');
module.exports = bunyan.createLogger({
    name: 'Paas-logger',
    stream: process.stderr,
    level: 'error'
});
