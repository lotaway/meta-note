/**
 * 数据库统一连接
 */
let mongoose = require('mongoose');
let config = require('./config.js');

module.exports = function () {
    let db = mongoose.connect(config.mongodb);

    require('../app/models/login.server.model');
    require('../app/models/user.server.model');
    require('../app/models/goods.server.model');

    return db;
};