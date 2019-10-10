
exports.up = function(db, next){
    var orgs = [
        {name: 'SemanticBits', subDomain: 'admin', sector: 'Information Technology', code: 'SEM'},
        {name: 'Development', subDomain: 'dev', sector: 'Testing Environment', code: 'DEV'}
    ];
    var organizations = db.collection('organizations');
    orgs.forEach(function(orgDetails, index) {
        organizations.findOne({name: new RegExp(orgDetails['name'], "i")},function(err, organization){
            if(!organization){
                organizations.insertOne({name: orgDetails['name'], subDomain: orgDetails['subDomain'],
                    sector: orgDetails['sector'], code: orgDetails['code'], enabled: true }, function(error, newOrg){
                    if(error){
                        console.log('Error occurred while saving organization: ' + error);
                    }
                    if (index === orgs.length-1) {
                        console.log("Loaded all development organizations");
                        next();
                    }
                });
            } else {
                if (index === orgs.length-1) {
                    console.log("Loaded all development organizations");
                    next();
                }
            }
        });
    });
    if (orgs.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
