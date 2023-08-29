# 关于webpack的配置项说明

## 对Webpack的打包行为做了配置，主要分为几个部分：

* ### entry
* 指定打包的入口文件，每有一个键值对，就是一个入口文件。
*
* ### output
* 配置打包结果，`path`定义了输出的文件夹，`filename`则定义了打包结果文件的名称，`filename`里面的`name`会由`entry`
  中的键（如entry1和entry2）替换。
*
* ### resolve
* 定义了解析模块路径时的配置，常用的就是`extensions`，可以用来指定模块的后缀，这样在引入模块时就不需要写后缀了，会自动补全。
*
* ### alias
* 定义路径别名或者文件别名，如：
* ```json alias: {"@": path.resolve(__dirname, "./src/") }```
* 以上是将`@`字符的路径指向源码所在文件夹`src`，这样在源码内的文件引用就可以写成`import xx from "@/service/xx"`
* 
* ### module
* 定义了对模块的处理逻辑，这里可以用`loaders`定义了一系列的加载器，以及一些正则。当需要加载的文件匹配`test`
  的正则时，就会调用后面的`loader`对文件进行处理，这正是`webpack`强大的原因。比如可以定义凡是`.js`
  结尾的文件都是用`babel-loader`做处理，而`.jsx`结尾的文件会先经过`jsx-loader`处理，然后经过`babel-loader`
  处理。当然这些`loader`也需要通过`npm install`安装。
*
* ### plugins
* 这里定义了需要使用的插件，比如`commonsPlugin`在打包多个入口文件时会提取出公用的部分，生成`common.js`

当然Webpack还有很多其他的配置，
具体可以参照它的[配置文档](http://webpack.github.io/docs/configuration.html)

```javascript
const webpack = require('webpack');
const commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
// const htmlWebpackPlugin = require('html-webpack-plugin'); //使用自动生成html文件的一个插件
const path = require('path');
module.exports = {
    entry: {
        entry1: "./src/blog",
        entry2: "./src/user"
    },
    output: {
        path: "./build",
        filename: '[name].entry.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader'
        }, {
            test: /\.jsx$/,
            loader: 'babel',
            exclude: "/node_modules/",
            //include:path.resolve(__dirname,"example")
        }]
    },
    plugins: [commonsPlugin],
    /*new htmlWebpackPlugin({
        title: ""
    })*/
};
```