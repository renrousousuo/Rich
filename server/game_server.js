var express = require('express');
var path = require('path');
var logger = require('morgan');
var swig = require('swig');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ =  require('underscore');
var log = require('loglevel');
var fs = require('fs');
log.setLevel('debug');



function GameServer(config) {
    var conf = {
        'port': 80, // 端口
        'static_prefix': '/static', // 
        'static_path': 'public', // 静态文件目录
        'app_path': __dirname, // 应用目录
    };
    this._conf = _.extend(conf, config);
    
    // http server 实例
    this.http = null;
    // expess app 实例
    this.app = null;
    
    this._createHttp();
    // socket io server 实例
    this._createSocket();
}

/**
 * 创建 http 服务
 *
 * @return {Object} http server 实例
 */
GameServer.prototype._createHttp = function () {
    var app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    var appPath = this._conf['app_path'];
    
    // view engine setup
    var viewPath = path.join(appPath, 'views');
    log.debug("[ndp]app path : %s ; view path : %s", appPath, viewPath);
    // This is where all the magic happens!
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', viewPath);
    // Swig will cache templates for you, but you can disable
    // that and use Express's caching instead, if you like:
    app.set('view cache', false);
    // To disable Swig's cache, do the following:
    swig.setDefaults({ cache: false });
    var swigFiltersScript = viewPath + '/filters.js';
    if (fs.existsSync(swigFiltersScript)) {
        var swigFilters = require(swigFiltersScript);
        for(var key in swigFilters){
            swig.setFilter(key, swigFilters[key]);
        }
    }
    
    // static file router
    var prefix = this._conf['static_prefix'];
    var staticPath = path.join(appPath, this._conf['static_path']);
    console.log("%s : %s", prefix, staticPath);
    app.use(prefix, express.static(staticPath));
    
    /// catch 404 and forward to error handler
    /*app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    /// error handlers
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error.html', {
            message: err.message,
            error: {}
        });
    });*/
    
    // 创建 server
    var server = require('http').Server(app);
    this.http = server;
    this.app = app;
};

/**
 * 创建 socket 服务
 *
 * @return {Object} http server 实例
 */
GameServer.prototype._createSocket = function () {
    var server = this.http;
    var io = require('socket.io')(server);
    this.io = io; 
}

/**
 * 启动服务
 *
 */
GameServer.prototype.start = function () {
    this.http.listen(this._conf.port);
};

/**
 * 设置路由
 */
GameServer.prototype.route = function (path, handler) {
    // to do
};


module.exports = GameServer;