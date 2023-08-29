@[TOC](Redis基础-数据类型和常见问题)

# 介绍

Redis是一个主要作用于应用程序与数据库之间，作为数据缓存层存在，通过存储在内存中高并发读写和可设置过期时间的非关系型数据库。
接下来是数据类型

# 数据类型

## string 字符串

这是最常用的数据类型，直接通过get、set即可读取和存储，通过del进行删除

```cmd
set [key] [value]
```

如：

```cmd
set db:version 1.0.0
```

可以看到由于只有一般对key是通过【表名 冒号 列名】的形式来设置

### 设置过期时间

```cmd
set [key] [value] ex [second]
```

该方法无论输入值是什么类型都会作为字符串存储，读取字符串只需要使用命令：

```cmd
get [key]
```

如：

```cmd
get dbversion
```

以上方法即可读出存储的内容，若没有设置过则是null
判断是否存在字符串，返回1或0：

```cmd
exist [key]
```

删除字符串：

```cmd
del [key]
```

## list 列表

列表是含有排序的两端皆可存读的结构
从左侧存入一个值：

```cmd
lpush [key] [value]
```

从右侧存入一个值：

```cmd
rpush [key] [value]
```

从左侧拿出一个值：

```cmd
lpop [key]
```

从右侧拿出一个值：

```cmd
rpop [key]
```

根据输入索引值范围读取值，通过输入[0,-1]读取所有值：

```cmd
lrange [key] [startIndex] [endIndex]
```

获取列表长度：

```cmd
llen [key]
```

删除列表中与对应值`value`相等的，`count`绝对值代表总删除数量，正负代表从头还是从尾部开始查找：

```cmd
lrem [key] [count] [value]
```

## hash 哈希值

哈希值即是通过唯一键找到对应的值，值可能有重复，但是键绝对没有重复。
设置哈希值：

```cmd
hset [key] [hashkey] [value]
```

根据键名读取哈希值：

```cmd
hget [key] [hashkey]
```

读取所有哈希值：

```cmd
hgetall [key]
```

判断是否存在哈希值：

```cmd
hexist [key] [hashkey]
```

删除哈希值：

```cmd
hdel [key] [hashkey]
```

## set 无序集合

添加值，可以一次添加一个，也可以一次添加多个，值不可重复

```cmd
sadd [key] [value] ... [value2] [value3]
```

读取所有值：

```cmd
smembers [key]
```

删除值：

```cmd
 srem [key] [value]
```

获取多个集合之间的并集sinter [key1] [key2] ... [keyN]。
示例通过定义标签tag对应的产品id，从而让选择多个标签后能快速挑选出对应的产品id
```cmd
sadd product:tags:1 1 4 9 7 3
sadd product:tags:2 1 7 8 9
sinter product:tags:1 product:tags:2
```
以上命令能获取到产品id值交集的 1 7 9，之后通过这些id去sql查询产品即可。

## zset / sorted set 有序集合

添加值，`score`数值将作为排序依据，默认从小到大排序：

```cmd
zadd [key] [score] [value]
```

根据输入的索引值范围从小到大获取值，[0,-1]将读取所有值：

```cmd
zrange [key] [startIndex] [endIndex] withscores
```

根据输入的索引值范围从大到小获取值，[0,-1]将读取所有值：

```cmd
zrevrange [key] [startIndex] [endIndex] withscores
```

根据分数范围获取值：

```cmd
zrangebyscore [key] [startScore] [endScore] withscores
```

删除值：

```cmd
zrem [key] [value]
```

# 列出所有键名

```cmd
keys *
```

# 判断值不存在才设置值

```cmd
setnx [key] [value] ex [second]
```

一般用于分布式锁的上锁，nx表示当值不存在才会执行，ex表示过期时间。或者用：

```cmd
set [key] [value] nx ex [second]
```

# 获取键的剩余时间（多久过期）

```cmd
ttl [key]
```

# 获取并删除值

用于分布式锁的解锁

```cmd
getdel [key]
```

# 订阅频道 Subscribe Channel

# Redis常见问题

## 缓存穿透

缓存穿透即如果在redis找不到缓存时，会直接访问数据库获取数据，但此时如果数据库也没有数据，而程序又因为请求不断重复这个过程，就会导致数据库访问量飙升。
解决方案：

* 对数据库空值进行缓存，这样后续空值不会访问数据库
* 启用监控黑名单，对疑似黑客攻击的端口进行限制和要求验证
* 使用布隆过滤器（后续统一讲解）
* 增加规则拦截，例如不满足uuid规则即视为无效访问

## 缓存击穿

类似缓存穿透，即高并发对空值数据访问，（原因可能是该数据为热门数据，例如活动抢购），导致就算第一次请求后设置空值或者因为缓存过期，没法阻止这种高频访问。

## 缓存雪崩

大量数据同时过期导致数据库访问量骤增。

* 调整过期时间，通过随机数对不同数据设置不同过期时间，提前缓存热门和根据数据实时热门情况调整过期时间，这样数据不会大批量同一时间过期
* 多级缓存，Nginx+redis+其他缓存
* 使用分布锁或队列，查不到数据时就加上锁，禁止其他人继续访问，强制等待

## redis服务宕机

* 削峰
* 熔断
* 集群

# 布隆过滤器

利用多个hash函数对数据进行计算，得出哈希值存放到二进制数组里，每次查询都先经过布隆过滤器判断数据是否不存在，不存在则直接返回。虽然不同数据也可能有重复的哈希值，这样数据量一多就导致判断不正确，但至少能过滤掉大量绝对不存在的数据访问请求。

# 持久化存储

持久化存储方案一般是RDB和AOF。

## RDB（Redis Database）

RDB即是将数据库定时打包生成一个本地二进制备份.rdb文件，这样和一般数据库的存储方式，可以非常顺利掌握，缺点就是可能在存储过程一般比较久，需要5分钟左右，最佳用法是一天或者一个月备份一次。

触发RDB保存有三种机制：

* 执行一次save命令。该命令会直接阻塞单线程的redis，备份保存完才可以继续执行其他读写命令。
* 执行一次bgsave命令。该命令会通过子进程进行备份，让父进程保持对其他命令的响应。
* redis.config中配置自动化，如`save 900 1`指代900秒内有一次以上修改操作则自动执行一次保存备份。

## AOF(Append Only-file)

AOF即日志存储，执行过修改操作后就会进行一次记录，若系统重启了则利用这些记录来恢复数据。
优势很明显，相比RDB是通过追加记录完成，备份速度快，但也因此占据空间大大增加。

触发AOF保存有两种机制，都需要在redis.config中进行配置：

* always：每次数据修改就会进行记录，数据完整性好，性能开销大
* everysec：每一秒进行同步，速度稍快，缺陷自然是宕机会丢失那一秒的数据

## 混合持久化

混合持久化即同时使用RDB和AOF，因RDB恢复会丢失大量数据（保存消耗时间长和配置自动保存的间隔长），而完整的AOF日志重放效率非常低，Redis4.0提供了混合式持久化方案，通过RDB文件配合增量的AOF日志达成高效与数据完整性的平衡。

# 集群

即Redis Cluster设置主从服务实例和Redis Sentinel集群监控。
