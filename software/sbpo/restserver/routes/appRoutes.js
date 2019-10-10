var express = require('express');
var path = require('path');
var staticRouter = express.Router();


staticRouter.get('/partials/:name', function(req, res) {
    res.render('partials/'+name);
});

staticRouter.get('/images/:name', function(req, res) {
    res.render('images/'+name);
});

staticRouter.get('/*', function(req, res) {
    res.render(path.join(__dirname, '../../client/index'));
});

module.exports = staticRouter;