@[TOC](mongodb基础学习-shell与mongoose操作)

# 开启服务

命令行开启服务，进入mongodb安装目录下的命令行输入以下命令：

```cmd
 mongod
 ```

该命令会启动mongodb的服务，如果是服务器或者长期持续使用需要设定为开机自动开启服务等方式。

# 配置

设置数据库位置、输出位置和安装服务：
mongod.exe --logpath d:/mongodb/logs --logappend --dbpath d:/websoft/mongodb/data --directoryperdb --serviceName MongoDB
-install

# 启动/停止服务

```cmd
net start MongoDB
net stop MongoDB
```

robmongod图形管理软件在mongod3.0以上时需要设置验证版本为3（默认为5），否则无法认证通过。
直接双击mongo.exe或在命令行输入以下命令进入mongo shell：

```cmd
mongo
```

在mongo shell中（非robmongo里）运行以下命令：

```shell
use admin
成功提示：switched to db admin
var s = db.system.version.findOne({"_id":"authSchema"})
s.currentVersion = 3
成功提示：3
db.system.version.save(s)
成功提示：WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
```

完成验证版本修改后，添加最高权限用户：

```shell
db.createUser({
  user: 'yourname',
  pwd: 'yourpassword',
  roles: [
    {
      role: 'root',
      db: 'admin'
      }
  ]
})
```

完成后重新启动mongod服务：

```shell
db.shutDownServer() // 关闭服务，或者在运行服务的命令行里Ctrl+C终止命令，或者直接关闭命令行
mongod --auth // 开启服务并启用认证
```

输入用户名和密码进行认证登陆：

```shell
use admin
db.auth('yourname','yourpassword')
```

查看帮助方法：

* help()  查看方法列表
* db.dataBaseName.help()  查看目标数据库可执行的方法

# shell操作

进入名称为`lulululu`的数据库，之后所有命令都会基于这个数据库执行

```shell
use lulululu;
```

删除数据库文档/表user

```shell
db.user.drop();
```

移除文档记录，搜索条件condition为空时会清空文档/表的所有记录

```shell
db.user.remove({
  # condition
});
```

## 搜索

```shell
db.user.find({
# 搜索条件 condition
  name: {
    $regex: "holmes"
  },
  sex: {
    $in: ["female", "elian"]
  },
  age: {
    $gt: 17,
    $lt: 30
  },
  job: {
    $nin: ["engineer"]
    },
  gps: {
    $within: {
      $: [[50, 49], 100]
    }
  }
},
# 返回字段 field
{
  _id: 0,
  name: 1,
  job
},
# 搜索选项 option
{
});
```

## 排序搜索

```shell
db.user.find({}).sort({
# 以`updateTime`字段为降序（从最近到远）
  updateTime: -1
});
```

## 分页

通过限制返回数量和跳过的数量进行分页

```shell
db.user.find({}).limit(20).skip(10);
```

## 更新文档/表

save()可在文档不存在时插入，存在时则更新

```shell
db.user.update({
# 搜索条件 condition
  salePrice: {
    $regex: "[0-9]"
  }
},
# 更新内容
{
  # 增减，只对数值类型有效
  $inc: {
    num: 1
  },
  # 对数组堆入新数据
  $push: {
    images: "/path/to/image"
  },
  # 对数组进行避免重复的更新，可配合$each填充多条记录
  $addToSet: {
    originImages: {
      $each: ["/path/to/image1", "/path/to/image2", "some/more/urls"]
    }
  },
  $set: {
  # 根据数组的索引进行更新
    "images.0": {
      null
    },
    # 根据（从上一个参数搜索条件中查出的）数组类型的值进行更新
    "images.$": {
      null
    }
  }
}
# 是否在不存在记录时执行插入操作
#, isInsert: Boolean
#, isMutily: Boolean
);
```

## 条件索引

根据条件建立索引，提升查找效率，mongodb本身查找过的内容也会自动建立索引，每个集合最多有64个索引：

```shell
db.collectionName.ensureIndex({
  createTime: -1
});
```

## 聚合

聚合管道，查找并改变输出：

```shell
db.getCollection("user").aggregate([
{
# 过滤
  $match: {
    isDelete: false
  },
# 显示
  $project: {
    title: 1,
    author: 1,
    isbn: {
      # 自定义字段
      prefix: {
      # 获取字符串字段
        $substr: [
          # 【字段名称，起始位置，字符数量】
          "$isbn", 0, 3
        ]
      }
    },
    lastName: "$author.last",
    hasDiscount: {
      # 判断，可跟if then语句
      $cond: {
        if: {
          $gte: ["$discount", 0]
        },
        then: true,
        else: false
      }
    },
    hasHigh: {
      # 并集布尔操作符，根据数组表达式返回
      $and: [[null], [false], true, 1]
    },
    hasHigh2: {
      # 非集布尔操作符，根据数组表达式返回
      $or: [undefined, 0]
    },
    noHasHigh: {
      # 取反布尔操作符，根据数组表达式返回
      $not: []
    },
    hasSameImgUrl: {
    # 等值布尔操作符，根据数组表达式返回。在数组表达式中，每项都为数组类型，对比项内部有是否相同值，项之间不进行对比。如`thumbImgs`自身内部有重复值则返回true，`thumbImgs`和`OriginImgs`之间不会进行对比
    $setEquals: ["$thumbImgs", "$originImgs"]
    },
    sameImgUrls: {
    # 对比若干个数组的项，返回相同值数组，忽略顺序
      $setIntersection: [
        "$thumbImgs", "$originImgs"
      ]
    },
    noMoreSame: {
    # 返回 合并重复项的数组，忽略顺序
      $setUnion: ["$thumbImgs", "$originImgs"]
    },
    somethingMore: {
    # 返回后者比前者多出的值数组，忽略顺序
      $setDifference: ["$thumbImgs", "$originImgs"]
    }
  },
  # 分组
  $group: {
  # 该操作根据`_id`的异同进行分组，设置为null则合并为一条文档记录
    _id: "$name",
    count: {
      # 求和，步长为1
      $sum: 1
    },
    totalPrice: {
      $sum: {
      # 求乘积
        $multiply: [
          "$price",
          "quantity"
        ]
      }
    },
    averageQuantity: {
    # 求平均值
      $avg: "$quantity"
    }
  }
},
{
  # 拆分，根据数组类型字段`sizes`拆分为多条文档记录
  $unwind: "$sizes"
}],
{
  # 优先于$sort
  $limit: 10,
  $skip: 5,
  $sort: {
    age: -1,
    posts: 1
  }
},
{
  # 根据字段`author`，创建集合副本
  $out: "author"
});
```

## 获取错误

获取执行命令后返回的错误信息：

```shell
db.runCommand({getLastError:1});
```

# 代码操作 mongoose

mongoose是为了方便nodejs操作mongodb而封装好的第三方库。
示例：

```javascript
const mongoose = require('mongoose');
// 连接数据库，参数为数据库地址，一般无论什么库或软件都是固定的，因为连接格式是操作系统和数据库服务提供的，通常为[数据库类型]:[账户名称]@[密码]//[域名或ip地址]:[端口]/[数据库名称]
const db = mongoose.connect('mongodb:sa@123123//127.0.0.1:27017/test');
db.connection.on('open', function () {
    console.log('数据库已连接成功~~');
});
/*  这个也是成功后触发的回调？
db.connection.on('connected', function () {
console.log('数据库连接');
});*/
db.connection.on('disconnected', function () {
    console.log('数据库连接丢失');
});
db.connection.on('error', function (error) {
    console.log('数据库连接失败：' + error);
});
process.on('SIGIHT', function () {
    mongoose.connect.close(function () {
        console.log('程序已结束，关闭数据库连接');
        process.exit(0);
    });
});
```

## 概念

* Schema 骨架，数据库文档组织形式，传统数据库所说的表结构。通过在代码里定义骨架，并绑定到数据文档/表上，之后就能通过Model模型和Entity实体来操作数据文档/表。一般是一个骨架对应一个文档/表。
* Model 模型，骨架绑定数据文档/表后创建的文档模型，一个模型对应一个骨架+文档/表，可以通过模型完成所有数据库操作，或者生成Entity实体进行限制性操作。
* Entity 实体，通过模型+预填数据生成，一个模型根据需要可以生成很多个实体，实体只能完成一些受限的操作，例如新增或查询。

## Schema 骨架

```javascript
const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
// 数据类型有 String字符串、Number数值、Date日期、数组、Boolean布尔、null、ObjectId、Mixed、内嵌文档，也支持Buffer？
    name: {
        // 设置类型和默认值
        type: String,
        default: 'unknow',
        // 以下为预定义方法
        set: function (data) {
            // 当骨架对应的模型进行数据库【设置】操作时，对输入的数据进行处理
            return data;
        },
        get: function (data) {
            // 当骨架对应的模型进行数据库【获取】操作时，对输出的数据进行处理
            return data;
        },
        trim: true, // 预定义的修饰符，去除字符串开头和结尾空格
        unique: true, // 设置为唯一索引，除了增加查询速度，还可以检查值是否唯一
        // 以下为预定义验证器
        required: true, // 表示字段是必须的
        enum: ['Mike', 'Jim', 'Tom'], // 表示字段必须为数组其中之一的值
        match: /name/g, // 表示字段必须符合该表达式
        // 自定义合法性验证器
        validate: function (data) {
            return data.length >= 4;
        }
    },
    phone: Number, // 可以直接设置类型
    age: {
        type: Number,
        Max: 200, // 最大值
        min: 0 // 最小值
    },
    createTime: {
        type: Date,
        default: Date.now(),
        index: true // 辅助索引，用于增加查询速度
    },
    updateTime: {
        type: Date,
        default: Date.now(),
        index: true
    },
    books: [],
    sex: Boolean,
    valuable: null,
    _id: ObjectId,
    // mongodb的id类型，12字节的BSON类型字符串。按照字节顺序，依次代表：4字节：UNIX时间戳；3字节：表示运行MongoDB的机器；2字节：表示生成此_id的进程；3字节：由一个随机数开始的计数器生成的值。区别于自增的id，可以用于分布式系统
    friends: [
        // 内嵌文档
        {
            name: String,
            age: Number
        }
    ]
});
```

### 追加属性

向Schema中追加属性：

```javascript
blogSchema.add({
    unknow: Mixed
});
```

### 设置虚拟属性

在Schema中设置虚拟属性，虚拟属性不会存储到数据库里，但可以用于输出：

```javascript
blogSchema.virtual('nickname').get(function () {
    // 当骨架对应的模型进行操作时，触发此方法赋值属性
    return '假面超人MonCaCa';
});
```

### 预处理中间件

预处理中间件之一，例如赋值创建时间，每次修改都更新时间：

```javascript
blogSchema.pre('save', /*/!*是否并行触发，可省略，默认false*!/true,*/ function (next, /*可以传入并行触发的函数*/done) {
    if (this.isNew) {
        this.createTime = this.updateTime = Date.now();
    } else {
        this.updateTime = Date.now();
    }
    next();
    done();
});
```

### 后置处理中间件

后置处理中间件之一，例如保存成功后：

```javascript
blogSchema.post('save', function (next) {
    console.log('save success');
    next();
});
```

### 设置模型实例方法

为模型添加实例方法，之后Entity实体可以调用该自定义方法：

```javascript
blogSchema.methods = {
    findByUsername(username, callback) {
        return this.model('user').find({username: username}, callback);
    },
    findByUserId(userId, callback) {
        return this.model('user').find({id: userId}, callback);
    }
};
```

追加写法1：

```javascript
blogSchema.methods('findByUsername', function (username, callback) {
});
```

追加写法2：

```
blogSchema.methods.findByUsername = function (username, callback) {
};
```

模型静态方法，静态方法在Model模型上就能使用：

```javascript
blogSchema.statics.findByTitle = function (title, callback) {
    return this.find({title: title}, callback);
};
```

## Model 模型

创建模型，把Schema结构对应到数据库里的集合上，通过该模型或者模型实体可以操作数据库（增删改查）：

```javascript
const blogModel = db.model(/*collectionName*/'blog', blogSchema);
const saveDoc = {
// 填入实际数据
    name: "Lenka",
    age: 36,
    sex: true
};
// 创建模型实体，比Model模型功能少，几乎只能新增和查询，不能调用Model的静态方法而只能调实例方法和实体内置方法
const blogEntity = new blogModel(saveDoc);
blogEntity.save(function (error) {
    if (error) {
        console.log(error);
        return;
    }
    console.log("写入成功");
})
```

# 增删改查

## 查询

### 基于模型静态方法的查询

查询条件为空时会返回全部文档。
最常用的查询选项就是限制返回结果的数量(limit函数)、忽略一点数量的结果(skip函数)以及排序(sort函数)

```javascript
// 伪造数据假装是实际前端提供的查询条件
let conditions = {
        username: 'emtity_demo_username',
        title: 'emtity_demo_title'
    },
    fields = {
        title: 1,
        content: 1,
        time: 1
    };
//  额外选项
const option = {
    limit: 20, // 限制最多查询N条记录
    skip: 10, // 在返回结果中跳过M条记录
    sort: {age: -1} // 排序操作，多个键/值对，键代表要排序的键名，值代表排序的方向，1是升序，-1是降序
};
//  返回所有满足条件的文档
blogModel.find(/*查询条件*/conditions, /*要返回的字段*/fields, /*查询选项*/option, /*回调*/function (err, result) {
    if (err) {
        console.log('error:' + err);
        return;
    }
    console.log(result);
});

// 返回首先找到的单个文档
blogModel.findOne(conditions, fields, {}, function (error, result) {
    if (error) console.log(error);
    console.log(result);
    db.close();
});
// 通过唯一的ID查找
// Model.findById()   

//  findByTitle是前面定义在Schema骨架上的静态方法
//  调用自定义的静态方法
blogModel.findByTitle('关于web3的十个疑问', function (error, result) {
    if (error) {
        console.log(error);
        return;
    }
    console.log(result);
});

// 基于自定义实例方法的查询
var blogEntity = new blogModel({});
//  findByUsername是定义在schema里的实例方法
blogEntity.findByUsername('model_demo_username', function (error, result) {
    if (error) {
        console.log(error);
        return;
    }
    console.log(result);
});

blogSchema.set('toJSON', {getters: true, virtual: true}); // 设置输出为JSON字符串时，会包含虚拟属性
console.log('blogEntity attr to json:' + JSON.stringify(blogEntity)); // 输出JSON为字符串
//Query.populate(path, [select], [model], [match], [options])
```

## 新增

```javascript
const saveData = {
    name: "Lenka",
    age: 36,
    sex: true
};
// 基于模型
blogModel.create(saveData, function (err, result) {
    if (err) {
        console.log('err:' + err);
        return;
    }
    console.log(result);
});

// 基于实体，要保存的数据是创建实体时就先决定的
var blogEntity = new blogModel(saveData);
blogEntity.save(function (err, result) {
    if (err) {
        console.log('err:' + err);
        return;
    }
    console.log(result);
});
```

## 更新

```javascript
blogModel.update(/*查询条件*/conditions, /*要修改的内容*/update, /*查询选项*/option, /*回调*/function (err) {
    if (err) {
        console.log('err:' + err);
        return;
    }
    console.log("更新成功");
});

//Model.findOneAndUpdate()，Model.findByIdAndUpdate()
```

## 删除

```javascript
TestModel.remove(/*删除条件*/conditions, function (error) {
    if (error) {
        console.log(error);
        return;
    }
    console.log('删除成功');
});
```

其他模型内置方法：

* Model.findOneAndRemove()，即只找到第一个符合条件的并删除
* Model.findByIdAndRemove()，即找到符合ObjectId条件（也是唯一一个）并删除

操作符：

* "$lt"(小于) { age:{ $lt: 20,$gt: 10 } }
* "$lte"(小于等于)
* "$gt"(大于)
* "$gte"(大于等于)
* "$ne"(不等于)
* "$in"(可单值和多个值的匹配) { name:{ $in: ['cali','jim'] } }
* "$or"(查询多个键值的任意给定值)    {$or:[ { name: 'test4' } , { age: 27}]}
* "$exists"(表示是否存在的意思)"$all"     {name: {$exists: true}

## 联表存储和查询

先定义骨架、模型和实体：

```javascript
// 可以直接在生成模型时定义骨架
const userModel = new mongoose.model('User', {
    username: String
});
const newsModel = new mongoose.model('News', {
    title: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // 关联文档/表
    }
});
const userEntity = new userModel({
    username: 'Jame Carry'
});
const newsEntity = new newsModel({
    title: 'this is a title',
    author: userEntity // 指向一个实体
});
```

执行联表查询

```javascript
// 先行存储无依赖项的表
userEntity.save(function (err) {
    if (err)
        return console.log(err);
    // 没有错误则存储有依赖项的表
    newsEntity.save(function (err) {
        if (err)
            return console.log(err);
        //  联表查询的实际例子（前面都是设置和保存数据）
        newsEntity.findOne()
            .populate(
                /*[path]指定被填充字段*/'author'
                /*,[select]指定填充字段,*/
                /*[model]指定模型，默认使用模式的ref属性, */
                /*[match]查询条件, [options]查询选项*/
            ).exec(function (err, doc) {
            if (err) {
                return next(err);
            }
            console.log('result:' + doc);
        });
    });
});
```

## 双向填充

填充Post的poster和comments字段以及comments的commenter字段:

```javascript
Post.find({title: 'post-by-aikin'})
    .populate('poster comments')
    .exec(function (err, docs) {
        var opts = [{
            path: 'comments.commenter',
            select: 'name',
            model: 'User'
        }];
        Post.populate(docs, opts, function (err, populatedDocs) {
            console.log(populatedDocs[0].poster.name);                  // aikin
            console.log(populatedDocs[0].comments[0].commenter.name);  // luna
        });
    });
```
