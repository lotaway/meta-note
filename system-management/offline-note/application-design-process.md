@[TOC](系统架构师-关于一个应用系统设计流程)

一个大型应用如数字化企业管理、即时聊天软件、ERP系统、商城系统等在设计之初会考虑很多东西。
在开始涉及真正的开发前后都会有大量的流程和设计工作需要由经理级别的人士完成。
一个应用一般会先根据应用特性或分类罗列出要实现的功能特性、使用场景、承载量等。
以下就介绍一下来源于开发经理的系统架构设计流程。

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

此处是考虑实际使用人数、数据量、流量等情况，包括瞬时数据和年月长期数据，根据这些情况决定后续的架构设计。
如：

* 用户人数，如10亿
* 歌曲数量，如1亿
* 单首歌曲大小（包含元数据等），5MB，这个基数将影响总存储空间大小和日常用户所需流量大小
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

## 流量考量

可能出现问题的原因是硬件CPU、内存或者带宽、句柄、硬盘IO、数据库连接数等上限导致的。

通常的整体架构：
* 负载均衡，包括DNS、Nginx反向代理、网关、注册中心、集群，注意要满足无状态化的设计则需要将相同的架构中心化，例如相同数据只有唯一一个缓存中心、只有唯一一个文件服务中心
* 水平扩展/复制数据，如增加机器、分布式镜像部署、系统集群、主从数据库、缓存，适用于整体流量比较大的情况
* 垂直拆分/拆分数据，分库分表，微服务、消息队列、适用于部分服务占据大部分流量，而其他服务几乎没有什么流量的情况
* 数据拆分+服务分区，综合运用前面水平和垂直两种方式，通过CDN，中台、云服务、备份，全球地区化（手机号）将用户区分到不同机房且呈现不同的区域数据，可能不需要考虑数据完全一致，

### 读取的性能优化

* 缓存，用内存换更快的读取执行速度，可以内嵌到系统中，或者外置一个单独的缓存服务。
* 读写分离，常见于读取流量远高于写入流量，可以配置一主N备数据库，分流从N个备用数据库读取，写入则从主数据库写入，之后定时从主数据库备份到从数据库。
* 并发，大数据筛选排序之类的场景，例如100亿交易数据里要取出金额最大排名前100的交易数据，考虑到单台机器的效率和内存不足，通过每10万条分发给多个机器执行筛选出各自的前100条，之后再聚合不同机器数据排序出最终的100条
* 异步流程，对必要流程保持同步执行，对不必要非关键的如发送通知改成异步，减少瞬时的性能耗时问题。
* 产品设计，常见的就是分页查询、渐进式展示、降低准确性（非实时查询或者仅统计热门数据）。

### 写入的性能优化

相比读取，写入的优化瓶颈有：
* 失败代价大，可能导致整个流程不一致（扣了钱却没有交易成功）
* 硬性需要持久化存到磁盘，不能全依赖内存缓存
* 需要加锁

优化：
* 数据拆分，变相提升并行写入效率
* 合理用锁（乐观锁和悲观锁、分片锁）
* 异步与批量，例如账户余额变化时，使用流水写入，请求a、b、c修改余额都是只写入到流水表或文件日志里，返回告诉用户说在处理中，之后有定时调度任务去批量获取流水，执行一个整体的加减计算后再写入到余额表里。
* 文件，为了解决数据库本身的写入速度和锁等问题，特别是数据量已经很大的情况下，可以利用写入文件来分摊一部分压力。
* 缓存，这部分属于特例，例如统计数据或者临时的实时人数数据放到缓存里，就算丢失也无所谓。


### 常见问题和大致处理方案

* 雪崩，某服务不可用或缓存过期后还出现大量请求导致所有关联服务都被拖垮，需要设置缓存集群分片
* 削峰，对于超过设定的并发量（服务最高承载量）后，对超额请求直接返回失败或放入延时等待队列中
* 限流，对单个服务请求设定限制单位时间内访问次数（如用计数器、令牌桶、漏桶和客户端验证码防刷），一般配合削峰使用
* 熔断，对于超过一定失败率的相同请求在一段时间内都直接返回失败
* 降级，对于超负荷/响应速度慢时，让非必要性服务请求放到延时等待队列中，请求本身状态变为处理中即可，让关键服务请求可以有更好的流量和响应速度

# DDD 领域驱动设计

DDD是针对一个领域的技术解决方案，例如做酒店经营，内部会包含如订房、早中晚餐、健身/泳池/桑拿房、节假日优惠券、房间清扫计划等。

特点：
* 以业务领域为核心进行建模（代码与数据结构）
* 使用到的概念符合该领域所有角色的认知
* 内部依旧符合高内聚、低耦合，方便拆解为微服务
* 能深入落地到专业领域进行实施实践

寻找业务专家、产品负责人、设计师、架构师开会，对业务概念、规则和过程进行分析，包含：

* 角色，即业务参与者，其可以触发命令，观察视图，并持续调整与触发命令直到达成目标或者观察到满意的视图反馈，例如卖家、买家、ERP系统、电商系统、物流系统
* 命令，由角色触发具体的动作，例如创建商品、提交审核等
* 系统与约束，触发的命令会根据业务规则对应的约束调用内外部系统，例如角色是否可创建商品、角色是否可提交审核等
* 事件，这个领域的业务事件，是由命令调用系统后所产生的，例如商品创建成功、审核已通过
* 策略，根据业务规则被事件激活，并进行响应：策略会反过来触发对应的命令，例如通知审核，通知上架
* 视图，事件会影响呈现的信息界面，提供给角色反馈信息

最终整理成领域模型和领域服务，领域模型可以视为对应数据表，而领域服务就是聚合这些表形成的服务。
而在领域之下会有基础层和接口层。
基础层就是底层实现，如缓存、数据库、消息通讯、rpc调用的实现。
接口层（interface）则是抽象化的部分，其覆盖了各种核心功能应当如何表现，并借由基础层和领域层去实现。
领域之上有应用层和服务层。
应用层就是最终呈现出来的一个个微服务应用，如库存系统、采购系统、物流系统、即时通讯系统。
要注意服务之前互相的通讯皆在应用层执行，例如执行rpc调用、接口（api）调用、消息队列调用等，在应用层之下是互相独立的，不会直接关联或通讯。
而服务层就是暴露出来的接口（api），应用可能本身有界面可供操作和管理，但暴露的接口可以提供给第三方或者基于微服务应用开发的大型应用，如电商系统、企业管理系统、社交媒体系统。

# 数据结构

这里的数据结构是指数据库的表结构设计。
基本到了这步就进入实际的开发环节了，当然前面可能需要先由产品经理或设计师给出流程图和原型设计稿，协定大致开发周期，之后才能开始接口文档契约和数据结构的设计。
完成原型设计和数据结构后就会进入前后端开发。

# 代码架构

到了架构师水平也会把控代码架构，拿Java后端开发举例，架构师会负责构建底层的接口层（interface和abstrct class）和基础层甚至领域（DDD）层，主要围绕抽象化的核心定义，加上设计一些模板代码用于规范入口、中间件、执行过程，强制让整个应用开发过程都需要通过继承、实现与重写架构师/高级开发人员的代码来完成业务流程，最大程度去规范初中级开发人员编写行为与发力方向。

如以下代码，注意是如何将入口和流程都抽象为一个个规范的类再进行组合：

```java
// 定义
interface RequestContext<Data> {
  String path;
  Object queries;
  Data data;
}

interface Processor<Info> {
  boolean isNeed(RequestContext);
  Info doProcess(RequestContext);
}

abstract class ServiceEngine<ProcessError> {

  ServiceEngine(RequestContext requestContext) {
    try {
      boolean result = checker(requestContext);
      if (result) {
        start(requestContext);
      }
    } catch(Exception ex) {
      errorException(ex);
    }
  }
  //  执行一些公共的检查，这里可以考虑中间件形式从子类加入更多检查
  boolean checker(RequestContext requestContext) {
    //  do something to make sure context verify
    return true;
  }

  abstract Array<Processor> getProcessors();

  void start() {
    Array<Processor> processors = getProcessors();
    processors.foreach
  }

  abstract void onStart(RequestContext requestContext);

  abstract void errorException(ProcessError error);
}

// 开发时

interface UserDto {
  String nickname;
  String username;
  Int id;
  Int status;
}

interface ProductDto {
  Int id;
  Int status;
  String name;
  String desc;
  String imagePath;
}
//  User、Product流程需要按照要求实现指定方法，即可让所有需要这些执行过程的ServiceEngine使用
class UserProcessor implements Processor<UserDto> {
  @Override
  boolean isNeed(RequestContext requestContext) {
    if (requestContext.path.indexOf("/user")) {
      return true;
    }
    return false;
  }

  @Override
  UserDto doProcess(RequestContext requestContext) {
    //  access database to return the data...
  }
}

class ProductProcessor implements Processor<ProductDto> {
  @Override
  boolean isNeed(RequestContext requestContext) {
    if (requestContext.path.indexOf("/product")) {
      return true;
    }
    return false;
  }

  @Override
  ProductDto doPRocess(RequestContext requestContext) {
    //  access database to return the data...
  }
}
//  A、B服务只需要继承后完成指定方法的重写即可
class AServiceEngine extends ServiceEngine {

  @Override
  void onStart() {
    // do something in here
  }

  @Override
  void errorException(ProcessError error) {
    System.out.println(error);
  }
}

class BServiceEngine extends ServiceEngine {

  @Override
  void onStart() {
    // do something in here
  }

  @Override
  void errorException(ProcessError error) {
    System.out.println(error);
  }
}

//  最终在Controller或者Service中使用：
@Controller("/product")
class ProductController {
  String getProductList() {
    ServiceEngine se = new AServiceEngine();
    return se.start(Request.getContext());
  }
}
```

# 结论
本文说得比较粗糙，但大体流程就是如此，其中可能涉及的细化工作都没有讲述，如流程图、思维导图、PPT、原型、效果图这些的制作都没有讲述，但对于一个高级管理人员来说这部分懂了也不一定自己亲手做，而是交给手下的人做，因此不会具体述说。
整体就是这样了。