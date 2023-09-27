# 微服务与分布式系统

## 7种常用的分布式系统模式

* 大使模式，通过代理大部分工作以便统一指挥调度各项任务并且无需暴露细节。
* 断路器模式，通过介入服务依赖之间的通讯，当某个服务不可用时会进行切断阻止连续崩毁
* CQRS/命令查询责任分离，通过分离读写来高效完成查询请求和写入命令。电商系统中比较常见，因为查询的商品列表和写入的交易比例为9：1以上
* 事件溯源，只不直接修改数据而是记录更新变化记录作为日志，有利于历史回溯，例如git就采用这种方式
* 领导选举，选举出领导模块，之后由领导模块决定其他参与责任竞争的节点哪个成为最终负责人，防止资源浪费；当领导节点挂了，则会从剩下节点中选择新的领导节点重复上述行为
* 发布者/订阅者模式，生产者发布事件到服务器，而订阅相关事件的消费者就可以主动或者被动接收事件进行处理，这也是异步消息队列常用的
* 分片技术，通过切分数据量来获得更好的性能和强壮性，也能配合实行数据本地化
* 杀手模式，逐步创建与原有大模块相似的核心功能，但拥有更强能力的小模块，之后逐步成长以达到最终取代原有模块的目的，过程中新旧模块并存，以便有更顺滑的迁移过程

# 更多学习资料

[日50万订单的分布式微服务](https://mp.weixin.qq.com/s/MbsPqEfqvMahMk51LNC6_g)

[微服务的拆分和组合](https://mp.weixin.qq.com/s/xHS2SYBssJ_9UeYJ0a0Jbw)

[服务器负载排查](https://mp.weixin.qq.com/s/IM6ETL7Xe92azOp7uu-HIw)

[微信的微服务](https://mp.weixin.qq.com/s/w65c2BC-oEN3d64boI3chw)

[微服务的基石--持续集成](https://mp.weixin.qq.com/s/8xdso73nKKvZFZ_bfXi_1A)

[微服务架构实施原理](https://mp.weixin.qq.com/s/xV5-yCxodDKcKJbjLgvj9g)

[接入层设计与动静资源隔离](https://mp.weixin.qq.com/s/lfFKfjhxxtNi0qHHNTvRAQ)

[数据库设计与读写分离](https://mp.weixin.qq.com/s/deUQ8cGRnW0XIS86tlxERw)

[无状态化和容器化](https://mp.weixin.qq.com/s/lN2g9aUnXp4vtjCvxXIqlA)

[分布式延时任务](https://mp.weixin.qq.com/s/Iii4niOLepOPJrJNyp0j-A)

[分布式消息队列](https://mp.weixin.qq.com/s/-7SD1BfxUct7TgIjxPvDSg)

[分布式的redis](https://mp.weixin.qq.com/s/_5fzR6xDqZhOvv-bKuJzGg)

[Redis开发设计规范及案例分析](https://mp.weixin.qq.com/s/gDHLlyfAtZdOUd6i-8gHCA)

[微服务的网关](https://mp.weixin.qq.com/s/TLk6GQhI_c5YlOcgrsBN-w)

[微服务治理](https://mp.weixin.qq.com/s/cUgPspB53lC8CTFaRiJJfAredis)

[分布式事务](https://mp.weixin.qq.com/s/gRKzyFodKyV87g2_pyFUMg)

[详解分布式系统与消息投递](https://mp.weixin.qq.com/s/-jb-FAXzUVepTLFpmgZt8A)