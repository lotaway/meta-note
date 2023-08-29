const mongoose = require('mongoose')
    , db = mongoose.connect("mongodb://127.0.0.1:27017/test")
;

//  商品虚拟模型
const goodsSchema = new mongoose.Schema({
    //  名称
    name: {
        type: String,
        max: 20,
        trim: true,
        required: true
    },
    pictures: [{
        type: Object,
        children: {
            bigImg: {
                type: String,
                default: ""
            }
        }
    }],
    attr: [],
    createTime: {
        type: Date,
        default: Date.now(),
        index: true //  辅助索引，用于增加查询速度
    },
    updateTime: {
        type: Date,
        default: Date.now(),
        index: true
    }
});

goodsSchema.pre("save", function (next, done) {
    if (this.isNew) {
        this.createTime = this.updateTime = Date.now();
    }
    else {
        this.updateTime = Date.now();
    }
    next();
    done();
});

const goods = new mongoose.model("goods", {});