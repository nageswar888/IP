var webpack = require('webpack');
var path = require('path');
require('ng-cache-loader');
require('ngtemplate-loader');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var isProd = (process.env.NODE_ENV === 'production');

var config = {
    context: __dirname + '/',
    resolve: {
        alias: {
            jquery: path.join(__dirname, '/bower_components/jquery/dist/jquery.js'),
            'angular-deferred-bootstrap': path.join(__dirname, '/bower_components/angular-deferred-bootstrap/angular-deferred-bootstrap.js'),
            d3: path.join(__dirname, '/bower_components/d3/d3.js'),
            nvd3: path.join(__dirname, '/bower_components/nvd3/build/nv.d3.js'),
            'spin.js': path.join(__dirname, '/bower_components/spin.js/spin.js'),
            moment: path.join(__dirname, '/bower_components/moment/moment.js'),
            'chart.js': path.join(__dirname, '/bower_components/chart.js/dist/Chart.js')
        }
    },
    entry: {
        app: './app/modules/sbpo'
    },
    devtool: "eval",
    output: {
        path: __dirname + '/js',
        publicPath: "/",
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: "ng-cache-loader?module=ng-templates&prefix=/app//[dir]/",
                exclude: /bower_components/
            },
            { test: /\.png$/, loader: 'url?name=app/images/[name].[ext]&mimetype=image/png' },
            { test: /\.gif$/, loader: 'url?name=app/images/[name].[ext]&mimetype=image/gif' }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': process.env.NODE_ENV
            }
        }),
        new webpack.ProvidePlugin({
            'jQuery': 'jquery',
            'window.deferredBootstrapper': 'angular-deferred-bootstrap',
            'Spinner': 'spin.js',
            'window.Spinner': 'spin.js',
            'moment': 'moment',
            'window.moment': 'moment'
        })
    ]
};

if(isProd) {
    config.plugins.push(new UglifyJSPlugin())
}

module.exports = config;