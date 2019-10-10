/**
 * Created by Ashish Lamse on 28/9/16.
 */
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', '../emailtemplates');
var appConfig = require('../../utils/apiUtils').getExternalConfigFile();

function mailDelivery(templateName, locals) {
    var sender=appConfig.mail.auth;
    var transporter = nodemailer.createTransport('smtp', {
        service: 'gmail',
        auth: {
            user: sender.email,
            pass: sender.pass
        }
    });


    emailTemplates(templatesDir, function (err, template) {
        if (err) {
            console.log("outside template function");
            console.log(err);
        }
        // Send a single email
        template(templateName, locals, function (err, html, text) {
            if (err) {
                console.log(err);
            }
            else{
                transporter.sendMail({
                    from: sender.email,
                    to: locals.toEmail,
                    bcc:locals.cc,
                    subject: locals.subject,
                    html: html,
                    text: text
                });
            }
        });
    });
};

exports.mailDelivery = mailDelivery;

