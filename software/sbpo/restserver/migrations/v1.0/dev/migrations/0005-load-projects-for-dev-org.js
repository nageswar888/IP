var passwordHash = require('password-hash');
var apiUtil=require('../../../../utils/apiUtils');

exports.up = function(db, next){
    var today = new Date();
    var projects = [
        {projectName: "SBPO", projectLocation: "Hyderabad", startDate: apiUtil.addDaysToDate(today, -10),
            endDate: apiUtil.addDaysToDate(today, 50), orgName : "SemanticBits"},
        {projectName: "Binja", projectLocation: "Hyderabad", startDate: apiUtil.addDaysToDate(today, -30),
            endDate: apiUtil.addDaysToDate(today, 30), orgName : "SemanticBits"},
        {projectName: "UPVS", projectLocation: "Hyderabad", startDate: apiUtil.addDaysToDate(today, -10),
            endDate: apiUtil.addDaysToDate(today, 80), orgName : "Development"},
        {projectName: "CTRP", projectLocation: "Hyderabad", startDate: apiUtil.addDaysToDate(today, -60),
            endDate: apiUtil.addDaysToDate(today, 60), orgName : "Development"},
        {projectName: "iPASS", projectLocation: "Hyderabad", startDate: apiUtil.addDaysToDate(today, -20),
            endDate: apiUtil.addDaysToDate(today, 70), orgName : "Development"}
    ];

    var orgCollection = db.collection('organizations');
    var projectsCollection = db.collection('projects');
    projects.forEach(function(projectDetails, index){
        orgCollection.findOne({name: new RegExp(projectDetails['orgName'], "i")}, function (error, organization) {
            if (organization) {
                console.log('Found organization::', organization);
                projectsCollection.insertOne({
                    projectName:projectDetails.projectName,
                    projectLocation:projectDetails.projectLocation,
                    startDate:projectDetails.startDate,
                    endDate:projectDetails.endDate,
                    "expired" : false,
                    "__v" : 0,
                    organization : organization._id}, function(error, newProject){
                    if (index === projects.length-1) {
                        console.log("Loaded all projects");
                        next();
                    }
                });
            }
        })
    });
    if (projects.length===0) {
        next();
    }
};

exports.down = function(db, next){
    next();
};
