var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cron = require('node-cron');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var acl = require('acl');
var logger = require('./config/logging');
var customValidator = require('./utils/customValidator');
var apiUtils= require('./utils/apiUtils');
var mongoose = require('mongoose');
var app = express();

var i18n = require("i18n");
var funkyObject = {};

i18n.configure({
  locales: ['en'],
  register: funkyObject,
  directory: __dirname + '/locales'
});

app.use(i18n.init);
var greeting = i18n.__('legacy_advice_tmp');
console.log("greeting"+greeting);
console.log('languaget test '+apiUtils.i18n('test.msg'));
app.use(express.static(__dirname + '/public'));
// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '../client/app/partials');
app.set('view engine', 'html');

var appConfig=require('./utils/apiUtils').getExternalConfigFile();

/* var conf = new config();*/
var advicePdfGenerator = require('./utils/advicePdfGenerator');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
/*app.use(logger('dev'));*/
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ limit: '5mb' }));
app.use(cookieParser());
app.use(customValidator);
//connect mongodb using mongoose
require('./models/db')(app, appConfig).then(init);
function init() {

  // This will change in production since we'll be using the dist folder
  app.use(express.static(path.join(__dirname, '../client')));
// This covers serving up the index page
  app.use(express.static(path.join(__dirname, '../client/.tmp')));
  app.use(express.static(path.join(__dirname, '../client/app')));
  acl = new acl(new acl.mongodbBackend(mongoose.connection.db, 'acl_'));

  var allRoutes = require("./routes/appRoutes");
  app.locals.acl = acl;
  app.all('/api/*', [require('./middlewares/authorization')(acl)]);
  console.log("Configure server routes");
  require("./routes/index")(app);
  console.log("Configured server routes");

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    console.log('in not found');
    err.status = 404;
    next(err);
  });

// error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'dev') {
    app.use(function (err, req, res, next) {
      logger.error(err);
      res.status(err.status || 500);
      res.json({
        message: err.message,
        error: err,
        dummy: "Dummpy message from node"
      });
      console.log(err)
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    logger.error(err);
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: {},
      dummy: "Dummpy message from node"
    });
    console.log(err)
  });
  cron.schedule('0 0 23 * * *', function(){
    console.log("Running cron scheduler job to clear old generated pdfs");
    advicePdfGenerator.cleanUpPdfs();
  });
  console.log("Application started successfully");
}

module.exports = app;
