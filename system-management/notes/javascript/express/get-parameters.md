@[TOC](获取参数)
express获取参数有三种方法，官网介绍如下：

# 获取route参数：req.params

例如：
客户端访问127.0.0.1:3000/index/12，（注意在路由规则里是写'/index/:id')
服务端可以通过使用req.params.id获得路由后面的值12，这种方法一般用于路由规则处理，利用这点可以非常方便的实现MVC模式；

# 获取get参数：req.query

例如：
客户端访问127.0.0.1:3000/index?id=12，
服务端通过使用req.query.id就可以获得id的值12；

# 获取post参数：req.body

例如：
客户端访问127.0.0.1：300/index，并用post方法（Form或Ajax）传递了一个id=12的数据，
服务端可以通过req.body.id获得id的值12；