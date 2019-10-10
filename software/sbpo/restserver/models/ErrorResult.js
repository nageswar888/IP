
//Result model for API
var ErrorResult = function( status, message, errors ) {
    this.status = status;
    this.messages = message;
    this.errors = errors;
};

module.exports = ErrorResult;
