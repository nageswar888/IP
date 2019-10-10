var Q = require('q');
var CustomFieldsModel = require('../models/CustomFieldsModel');

var customFieldUtils = {
    removeCustomField:function(customFieldId){
        var deferred = Q.defer();
        CustomFieldsModel.remove({_id:customFieldId},
            function(error, result) {
                if (error) {
                    deferred.reject(error);
                }
                else{
                    deferred.resolve(result);
                }
            });
        return deferred.promise;
    }
};

module.exports = customFieldUtils;
