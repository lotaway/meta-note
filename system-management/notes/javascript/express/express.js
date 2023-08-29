/**
 * 对express配置
 * https://www.npmjs.com/package/pm2 pm2持续运行、重启
 */

let express = require('express'),
    path = require('path'),
    fs = require('fs'),
    jade = require('jade'),
//mongoose = require('mongoose'),
    mongoose = require('./mongoose'),    //  设置好的连接
    bodyParser = require('body-parser'),    //  用于解析post值数据
    cookieParser = require('cookie-parser'),
    session = require('express-session'),   //  会话（session）支持中间件
    logger = require('morgan'),
    config = require('./config.js'),
    main_router = require('../app/routes/main'),
    ejs = require('ejs');

let MongoStore = require('connect-mongo')(session), //  将 session 存储于 mongodb，需结合 express-session 使用，我们也可以将 session 存储于 redis，如 connect-redis
    db = mongoose(),
    app = express();
// connect-flash: 基于 session 实现的用于通知功能的中间件，需结合 express-session 使用

// 模板路径
app.set('views', path.join(__dirname, '../views'));
//  模板引擎
app.set('view engine', 'jade');
app.engine('.html', ejs.__express);

app.use(logger('dev'));
//app.use(bodyParser.raw); // 没有？
app.use(bodyParser.json({
    //verify参数本身是用于对请求的校验，当校验失败的时候通过抛出error来中止body-parser的解析动作，在这里被借用来实现post参数raw body的获取。
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf;
    }
}));
app.use(bodyParser.urlencoded({
    extended: false,
    /*    verify: function (req, res, buf, encoding) {
     req.rawBody = buf;
     }*/
}));
app.use(cookieParser());

//  session直接存在内存中，进程退出后（如重启）就会丢失
/*app.use(session({
 secret: 'hubwiz app', //secret的值建议使用随机字符串
 cookie: {maxAge: 60 * 1000 * 30} // 过期时间（毫秒）
 }));*/

//  session存在数据库中（持久化存储）
app.use(session({
    secret: config.cookieSecret, //secret的值建议使用128个随机字符串
    cookie: {maxAge: 60 * 1000 * 60 * 24 * 14}, //过期时间
    resave: true, // 即使 session 没有被修改，也保存 session 值，默认为 true
    saveUninitialized: true,
    store: new MongoStore({
        url: config.mongodb
    })
}));

//  静态文件路径
app.use(express.static(path.join(__dirname, '../public')));
app.use('/favicon.icon', function (req, res) {
    res.end();
});
//  路由规则引用
app.use("", main_router);
//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to login
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

process.on('uncaughtException', error => {
    fs.writeSync(1, `Caught exception: ${error}`);
    console.log(error);
});

module.exports = app;