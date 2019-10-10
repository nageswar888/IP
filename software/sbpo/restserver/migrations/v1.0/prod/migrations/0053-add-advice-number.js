var mongodb = require('mongodb');
var Q = require('q');
exports.up = function(db, next){
    var adviceCollection = db.collection('advices');
    var counterCollection = db.collection('counters');
    var organizationCollection = db.collection('organizations');
    var organizationIndex = 1;
    var allAdvCount = 0, completedAdvCount=0;
    //array
    //get all organizations
    organizationCollection.count(function(err,organizationCount) {
        organizationCollection.find({}).forEach(function(organization) {
            var promisesArr=[];
            var seq = 1;
            var adviceIndex = 1;

            adviceCollection.count({organization:organization._id},function(err,adviceCount) {
                allAdvCount += adviceCount;
                //each organization, get all advices and update
                adviceCollection.find({organization:organization._id},{ _id: 1,organization:1 }).forEach(function(advice) {
                    promisesArr.push(updateAdviceNumber(advice,organization,seq++));
                    if(adviceCount == adviceIndex) {
                        Q.allSettled(promisesArr)
                            .then(function () {
                                completedAdvCount += adviceCount;
                                //for-each orgazations
                                counterCollection.update(
                                    {model: 'Advice', organization:organization._id },
                                    {'$set':{'seq': seq-1}},
                                    {
                                        'upsert': true
                                    }
                                    )
                                    .then(function(advCount) {
                                        console.log("updated count-->",advCount);
                                    })
                                    .catch(function(error) {
                                        console.error("counter error--> : "+error);
                                    });

                                if(organizationIndex == organizationCount && completedAdvCount == allAdvCount){
                                    next();
                                }
                            });
                    }
                    adviceIndex++;
                });
            });
            if(organizationIndex < organizationCount) {
                organizationIndex++;
            }
        });

    });
    /**
     *
     * @param organization
     * @param doc
     */
    function updateAdviceNumber(advice,organization,docSeq){
        var deferred = Q.defer();
        var s = "000000000" + docSeq;
        var adviceNumber = organization.code + '' + s.substr(s.length - 10);
        adviceCollection.update(
            {"_id":advice._id},
            {'$set':{'adviceNumber': adviceNumber }},
            {upsert: true},function(err){
                if(err){
                    deferred.reject()
                }
                else {
                    deferred.resolve();
                }
            }
        );
        return deferred.promise;
    }
};

exports.down = function(db, next){
    next();
};
