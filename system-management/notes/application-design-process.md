@[TOC](产品经理/架构师-关于一个应用系统设计流程)

一个大型应用如数字化企业管理、即时聊天软件、ERP系统、商城系统等在设计之初会考虑很多东西。
在开始涉及真正的开发前后都会有大量的流程和设计工作需要由经理级别的人士完成。
一个应用一般会先根据应用特性或分类罗列出要实现的功能特性、使用场景、承载量等。
以下就介绍一下来源于谷歌开发经理的设计流程。

# 功能点

例如一个音乐软件会包含以下功能特性：

* 音乐歌曲
* 播放列表
* 用户
* 艺术家
* 广播

要注意这里不会罗列出所有功能，要分清哪些是重要功能而哪些不是。
例如这里可能有一些扩展开来的分类、搜索、关注、编辑资料、联想歌曲、音量调节。
之后再围绕这些功能持续沟通提出和解答可能出现的问题，为后续评估做准备。

# 目标用户与用例

这里是需要考虑面向的用户是什么年龄段、会使用这个应用做什么，可以举例具体的操作流程，例如：

* 搜索并播放歌曲
* 打开播放列表播放多首歌曲

# 承载量

此处是考虑实际使用人数、数据量、流量等情况，根据这些情况决定后续的架构设计。
如：

* 用户人数，如10亿
* 歌曲数量，如1亿
* 单首歌曲大小（包含元数据等），5MB
* 总歌曲大小，500TB
* 备份歌曲x3，1500TB
* 单个用户数据大小，1KB
* 所有用户数据大小，1TB

# 架构设计

这里需要完成系统整体的架构设计：

* LB，负载均衡，通过对多个服务根据策略平衡各种请求响应要求，防止服务挂掉，对于高并发应用非常重要。要注意可以同时采用多种方式完成负载均衡，如Nginx自带有负载均衡配置，除此之外再通过自定义的路由更进一步分流是可行的。
* Web Server，多个网络服务交给LB完成集群式服务保障
* DB，数据库，根据情况需要拆分为不同服务的数据库，如用户、歌曲元数据、艺术家资料存放在一个NO-SQL数据库，使用Redis之类作为缓存，而歌曲实际存放位置放在另一个数据库，使用SQL数据库，如AWS。这里根据要求也可以再扩展为三读一写的多数据库配置
  S3
* 流媒体服务器（可选），如果有音视频功能如唱歌直播、MV等需要考虑。
* CDN（可选），对歌曲数据进行多节点缓存，减少大量用户同时播放或下载歌曲导致对单一服务器压力过大的问题，关键点在于歌曲本身几乎不会被更新，缓存是可行的。

# 数据结构

这里的数据结构是指数据库的表结构设计。
基本到了这步就进入实际的开发环节了，当然前面可能需要先由产品经理或设计师给出流程图和原型设计稿，协定大致开发周期，之后才能开始接口文档契约和数据结构的设计。
完成原型设计和数据结构后就会进入前后端开发，本文主要是从高级层面讲述面试可能遇到的询问，接下来的开发工作工程师都比较清楚，就不再详述。

# 结论
本文说得比较粗糙，但大体流程就是如此，其中可能涉及的细化工作都没有讲述，如流程图、思维导图、PPT、原型、效果图这些的制作都没有讲述，但对于一个高级管理人员来说这部分懂了也不一定自己亲手做，而是交给手下的人做，因此不会具体述说。
整体就是这样了。