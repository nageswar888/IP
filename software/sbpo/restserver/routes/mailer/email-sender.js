var nodemailer = require('nodemailer');
var appConfig = require('../../utils/apiUtils').getExternalConfigFile();
var emailTemplates = require('email-templates');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', '../emailtemplates');

function sendEmail(templateName, locals, fn) {
    var EmailAddressRequiredError = new Error('Email address required.');
    var EmailSubjectRequiredError = new Error('Email subject required.');

    var sender=appConfig.mail.auth;
    var transporter = nodemailer.createTransport('smtp', {
        service: 'gmail',
        auth: {
            user: sender.email,
            pass: sender.pass
        }
    });

    // make sure that we have an user email
    if (!locals.toEmail) {
        return fn(EmailAddressRequiredError);
    }
    // make sure that we have a subject
    if (!locals.subject) {
        return fn(EmailSubjectRequiredError);
    }

    emailTemplates(templatesDir, function (err, template) {
        if (err) {
            //console.log(err);
            return fn(err);
        }
        // Send a single email
        template(templateName, locals, function (err, html, text) {
            console.log("Inside email sender");
            if (err) {
                console.log(err);
                return fn(err);
            }

            transporter.sendMail({
                from: appConfig.mail.defaultFromAddress,
                to: locals.toEmail,
                subject: locals.subject,
                html: html,
                // generateTextFromHTML: true,
                text: text
            }, function(err, info) {
                if (err) {
                    return fn(err);
                }
                return fn(null, info.message, html, text);
            });
        });
    });
};

exports.sendEmail = sendEmail;
