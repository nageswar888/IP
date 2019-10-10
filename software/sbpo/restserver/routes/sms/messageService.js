var unirest = require('unirest');
var appConfig = require('../../utils/apiUtils').getExternalConfigFile();
var Q = require('q');

var messageService = {
    /**
     * To send the sms Please use the messageService like below
     * Eg: messageService.sendSMS('Test SMS', [{"gsm": "+919494936098"}]);
     **/
    sendSMS: function (message, recipients)
    {
        var deferred = Q.defer();
        console.log("Sending message to recipients....", appConfig.sms.provider);
        unirest.post(appConfig.sms.provider.url)
            .headers({'Accept': '*/*', 'Content-Type': 'application/json'})
            .send({
                "authentication": {
                    "username": appConfig.sms.provider.username,
                    "password": appConfig.sms.provider.password
                },
                "messages": [
                    {
                        "sender": appConfig.sms.provider.sender,
                        "text": message,
                        "recipients": recipients
                    }
                ]
            })
            .end(function (response) {
                console.log(response.body);
                deferred.resolve(response.body)
            });
        return deferred.promise;
    }
};

module.exports = messageService;