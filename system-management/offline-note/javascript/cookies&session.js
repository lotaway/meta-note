/**
 * Created by lw on 2016/5/28.
 */
const express = require('express')
const router = express.Router()

router.get('/page', function (req, res) {
    //  nodejs向客户端发送cookie有两个方案：
    // 1 使用response.writeHead，代码如下：
    var time = (new Date()).getTime() + 60 * 1000; //设置过期时间为一分钟
    var time2 = new Date(time);
    var timeObj = time2.toGMTString();
    res.writeHead({
        'Set-Cookie': 'myCookie="type=ninja", "language=javascript";path="/";Expires=' + timeObj + ';httpOnly=true'
    });
    //缺点：使用response.writeHead只能发送一次头部，即只能调用一次，且不能与response.render共存，否则会报错。

//使用response.cookie，代码示例如下：
    res.cookie('haha', 'name1=value1&name2=value2', {maxAge: 10 * 1000, path: '/', httpOnly: true});
    //语法: response.cookie('cookieName', 'name=value[name=value...]',[options]);


// express的cookie获取与设置：

    // 如果请求中的 cookie 存在 isVisit, 则输出 cookie
    if (req.cookies.isVisit) {
        console.log(req.cookies);
        res.send("再次欢迎访问");
    }
    // 否则，设置 cookie 字段 isVisit, 并设置过期时间为1分钟
    else {
        res.cookie('isVisit', 1, {maxAge: 60 * 1000});
        res.send("欢迎第一次访问");
    }
});


/**
 session是另一种记录客户状态的机制，不同的是Cookie保存在客户端浏览器中，而session保存在服务器上。

 主要的方法是session(options)，其中 options 中包含可选参数，主要有：
 name:       设置 cookie 中，保存 session 的字段名称，默认为 connect.sid 。
 store:      session 的存储方式，默认存放在内存中，也可以使用 redis，mongodb 等。express 生态中都有相应模块的支持。
 secret:     通过设置的 secret 字符串，来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改。
 cookie:     设置存放 session id 的 cookie 的相关选项，默认为 (default: { path: '/', httpOnly: true, secure: false, maxAge: null })
 genid:      产生一个新的 session_id 时，所使用的函数， 默认使用 uid2 这个 npm 包。
 rolling:    每个请求都重新设置一个 cookie，默认为 false。
 resave:     即使 session 没有被修改，也保存 session 值，默认为 true。
 */


var express = require('express');
var session = require('express-session');
var app = express();

//  session直接存在内存中，进程退出后（如重启）就会丢失
app.use(session({
    secret: 'hubwiz app', //secret的值建议使用随机字符串
    cookie: {maxAge: 60 * 1000 * 30} // 过期时间（毫秒）
}));
//  链接数据库
mongoose.connect('mongodb:127.0.0.1:27017/test');
mongoose.connection.on('open', function () {
    console.log('-----------数据库连接成功------------');
});
//  session存在数据库中（持久化存储）
app.use(session({
    secret: "what do you want to do?", //secret的值建议使用128个随机字符串
    cookie: {maxAge: 60 * 1000 * 60 * 24 * 14}, //过期时间
    //resave: true, // 即使 session 没有被修改，也保存 session 值，默认为 true
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection //使用已有的数据库连接
    })
}));

/**
 Redis是一个非常适合用于Session管理的数据库。第一，它的结构简单，key-value的形式非常符合SessionID-UserID的存储；第二，读写速度非常快；第三，自身支持数据自动过期和清除；第四，语法、部署非常简单。基于以上原因，很多Session管理都是基于Redis实现的。所以我们这个示例将用redis管理session。

 Express已经将Session管理的整个实现过程简化到仅仅几行代码的配置的地步了，你完全不用理解整个session产生、存储、返回、过期、再颁发的结构，使用Express和Redis实现Session管理，只要两个中间件就足够了：
 express-session
 connect-redis

 参数:
 client 你可以复用现有的redis客户端对象， 由 redis.createClient() 创建
 host Redis服务器名
 port Redis服务器端口
 socket Redis服务器的unix_socket

 可选参数:
 ttl Redis session TTL 过期时间 （秒）
 disableTTL 禁用设置的 TTL
 db 使用第几个数据库
 pass Redis数据库的密码
 prefix 数据表前辍即schema, 默认为 "sess:"
 */

/*
 //req在经过session中间件的时候就会自动完成session的有效性验证、延期/重新颁发、以及对session中数据的获取了。

 使用示例： */

var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var app = express();
var options = {
    "host": "127.0.0.1",
    "port": "6379",
    "ttl": 60 * 60 * 24 * 30   //session的有效期为30天(秒)
};

// 此时req对象还没有session这个属性
app.use(session({
    store: new RedisStore(options),
    secret: 'express is powerful'
}));

app.listen(80);