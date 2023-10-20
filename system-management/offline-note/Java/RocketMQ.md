@[TOC](Java with RocketMQ)

# 概念

MQ指代Message Queue消息队列，通过在两个服务之间加入这种独立的消息队列应用，从而解耦不同服务之间的代码，使之可以通过熔断、限流等方式提供稳定可靠的高并发。
不同服务之间是通过发布与订阅的关系来生产和消费对应的消息，消息指代的是主题+标签+任意的数据内容。

发送消息的方式：
* 同步，指生产者发送消息后等待结果返回，期间阻塞线程；
* 异步，指生产者发送消息到队列后只留下成功与失败的异步回调入口，线程继续执行其他任务；
* 单向，指生产者只发送消息但不关心后续情况，不期待结果。

接受消息的方式：
* 推，指消费者处于被动监听，等待消息队列推送消息过来，这会对消息队列应用造成更大压力，且控制权在消息列队应用上而不在消费者服务；
* 拉，指消费者主动去拉取消息，这样消费者服务拥有更多主动权，但也更容易对消费者造成额外性能损耗。

# 开始

1. 可直接下载包安装或者通过Docker拉取镜像使用；
2. 暴露PATH和mqnamesrv；
3. 配置name server和broker后都启动；
4. 使用内置的工具执行发送与接受消息队列测试；
5. （可选）增加集群，配置多个worker，指定IP地址、密码、禁用防火墙、broker主从节点等；
6. （可选）安装RocketMQ-Dashboard可以进行图形化界面管理RocketMQ；
7. 在开发中引入并使用rocket-mq-client生产、消费消息。

第7点会在后面详细说明，前面的步骤需要先行完成。

# 开发

用到的关键代码：

* DefaultMQProducer 生产者，需要指定组名、name server所在IP地址，启动后可以发送消息，用完需要关闭。
* Message 消息载体，包含主题、标签、内容，用于提供给生产者要发送的消息。
* MessageQueueSelector，发送消息选择器，producer.send()的参数，用于指定要发送哪个消息，可以传入索引值来让其按顺序发送消息（不使用时消息发送默认是随机的），需要在消费者中使用MessageListenerOrderly搭配消费处理。
* DefaultPushMessageConsumer，推消息消费者，需要指定组名和name server服务所在IP地址和端口号，订阅主题与筛选标签后，添加监听器后启动可以接收和消费消息。
* DefaultLitePullConsumer，拉消息消费者，可以随机获取一个消息队列或者指定一个消息队列
* MessageListenerConcurrently，消息无序监听器
* MessageListenerOrderly，消息有序监听器，需要在生产者中搭配MessageQueueSelector预先处理。

示例：

先在maven引入rocketmq-client库包

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.rocketmq</groupId>
        <artifactId>rocketmq-client</artifactId>
        <version>5.1.0</version>
    </dependency>
</dependencies>
```

定义可以重复用于发送消息的类方法：

```java
import java.util.Arrays;

public class TheProducer {
    public static void test(String content) {
        DefaultMQProducer producer = new DefaultMQProducer("JustAProducerGroupName");
        producer.setNamesrvAddr("192.168.43.137:9876");
        producer.start();
        CountDownLatch countDownLatch = new CountDownLatch(10);
        for (int i = 0; i < 10; i++) {
            Message msg = new Message("JustATopic", "SomeTags", (i + content).getBytes(StandardCharsets.UTF_8));
            //  同步发送，阻塞等待拿到发送结果，使用MessageQueueSelector让其按照循环顺序发送
            SendResult sendResult = producer.send(msg, new MessageQueueSelector() {
                @Override
                public MessageQueue select(List<MessageQueue> list, Message message, Object n) {
                    //   这里的n实际上send方法第三个实参传进来的索引值i
                    Integer id = (Integer) n;
                    int index = id % list.size();
                    return list.get(index);
                }
            }, i);
            //  异步发送，注意没有使用MessageQueueSelector，此时消息看起来是按照循环的顺序发送，但实际并非如此而是随机的。
            producer.send(msg, new SendCallback() {
                @Override
                public void onSuccess(SendResult sendResult) {
                    countDownLatch.countDown();
                    System.out.println("Success result: %d,%d", sendResult, i);
                }

                @Override
                public void onException(Throwable throwable) {
                    countDownLatch.countDown();
                    System.out.println("Error: %s,%d", Arrays.toString(throwable.getStackTrace()), i);
                }
            });
            //  单向发送
            //  producer.sendOneway(msg);
        }
        countDownLatch.await(5, TimeUnit.SECONDS);
        producer.shutdown();
    }
}
```

定义接受推送消息的类方法：

```java
public class PushConsumer {
    public static void start() {
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("JustAConsumerGroupName");
        consumer.setNamesrvAddr("192.168.43.137:9876");
        //  *号表示接受所有Tags
        consumer.subscribe("JustATopic", "*");
        //  添加了一个无序监听器
        consumer.setMessageListener(new MessageListenerConcurrently() {
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> list, ConsumeConcurrentlyContext consumeContext) {
                list.forEachIndexed((msg, index) -> {
                    System.out.printf("Message: %d, %s", i, Arrays.toString(msg.getBody()));
                });
                return ConsumeConcurrentlyStatus.CONSUME_SUCESS;
            }
        });
        consumer.start();
    }
}
```

定义拉取消息的类方法：

```java
import java.util.Collection;

public class RandomPullConsumer {
    public static void start() {
        DefaultLitePullConsumer consumer = new DefaultLitePullConsumer("JustAConsumerGroupName");
        consumer.setNamesrvAddr("192.168.43.137:9876");
        //  指定主题和筛选标签，拉取时（调用poll方法）由消息队列应用随机提供一个返回
        consumer.subscribe("JustATopic", "*");
        consumer.start();
        while (true) {
            List<MessageExt> messageExtList = consumer.poll();
            System.out.println("Success get message");
            messageExt.forEach(msg -> {
                System.out.println("Message:%d", String.valueOf(msg.getBody()));
            });
        }
    }
}

public class AppointPullConsumer {
    public static void start() {
        DefaultLitePullConsumer consumer = new DefaultLitePullConsumer("JustAConsumerGroupName");
        consumer.setNamesrvAddr("192.168.43.137:9876");
        consumer.start();
        Collection<MessageQueue> messageQueues = consumer.fetchMessageQueues("JustATopic");
        ArrayList<MessageQueue> messageQueueList = new ArrayList<>(messageQueues);
        consumer.assign(messageQueueList);
        //  从指定的队列里获取某个消息，这里是指定了队列ID并获取到10个为止
        consumer.seek(messageQueueList.get(0), 10);
        while (true) {
            List<MessageExt> messageExtList = consumer.poll();
            System.out.println("Success get message");
            messageExt.forEach(msg -> {
                System.out.println("Message:%d", String.valueOf(msg.getBody()));
            });
        }
    }
}
```

## 广播

通过设置consumer.setMessageModel()来决定，广播方式分为：
* MessageModel.BROADCASTING 广播消息，一条消息会发送给所有订阅了对应主题的消费者，无论是否同一个组的消费者，相当于所有符合要求的消费者都会接受到该消息。
* MessageModel.CLUSTERING 集群消息，一条消息只能被同一个消费者组里的一个实例消费，相当于同一个组里只有一个消费者只会接到一条该消息，但不同组都会接收到消息。

```java
DefaultPushConsumer consumer = new DefaultPushConsumer("JustAGroupName");
consumer.setMessageModel(MessageModel.BROADCASTING);
```

## 延时发送

对Message使用以下任意一个方法可以设置延时：
* message.setDelayTimeLevel，设置延时等级，可选1~8，对应1s，2s，...，2h
* message.setDelayTimeMS，设置延时毫秒

```java
Message message = new Message();
message.setDelayTimeLevel(2);
```

## 批量消息

producer.send是可以直接传递List<Message>实参来批量发送消息的，但要注意消息总大小不能超过4M，且性能最佳大小为1M。
可以将这种限制与优化协程一个迭代器来帮助将位置大小的批量消息切成合适大小，关键点在于计算已经封装好的message大小。

```java
public class MessageIterator implements Iterator<List<Message>> {

    List<Message> messageList;
    private int currentIndex;
    private int maxMessageSize = 10 * 1000;

    MessageIterator(List<Message> messageList) {
        this.messageList = messageList;
    }

    public boolean hasNext() {
        return currentIndex < messageList.size();
    }

    public List<Message> next() {
        int nextIndex = currentIndex;
        int totalSize = 0;
        for (; nextIndex < messageList.size(); nextIndex++) {
            Message message = messageList.get(nextIndex);
            int logSize = 20;
            int messageSize = logSize + message.getBody().length + message.getTopic().length();
            Map<String, String> properties = message.getProerties();
            Iterator<Map.Entry<String, String>> propertiesIterator = properties.entrySet().iterator();
            while (propertiesIterator.hasNext()) {
                Map.Entry<String, String> entry = iterator.next();
                messageSize += entry.getKey().length() + entry.getValue().length();
            }
            if (messageSize > maxMessageSize) {
                if (nextIndex == currentIndex)
                    nextIndex++;
                break;
            }
            if (messageSize + totalSize > maxMessageSize) {
                break;
            } else {
                totalSize += messageSize;
            }
        }
        List<Message> newMessageList = messageList.subList(currentIndex, nextIndex);
        currentIndex = nextIndex;
    }
}

public class BatchProducer {
    public static void start() {
        DefaultMQProducer producer = new DefaultMQProducer("JustAGroupName");
        List<Message> messageList = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            Message message = new Message("JustATopic", "someTags", ("SomeContent").getBytes(StandardCharsets.UTF_8));
            messageList.add(message);
        }
        MessageIterator messageIterator = new MessageIterator(messageList);
        while (messageIterator.hasNext()) {
            SendResult sendResult = producer.send(messageIterator.next());
        }
    }
}
```

## 过滤消息

* Tag 标签，每条消息可以定义单个字符串作为标签，消费者可以且或进行过滤查询，比较简单。
* Sql 查询语句，生产者可以设置自定义的属性，之后消费者使用类似SQL同时查询Tag和自定义属性是否满足条件，达成复杂查询。注意只有推模式消费者才能使用，过滤操作是在消息队列应用的broker里完成的，拉模式不可用。

生产者设置Tag：

```java
Message message = new Message("JustATopic", "TagA", "Some content".getBytes(Standard.UTF_8));
```

消费者使用Tag过滤消息：

```java
DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("JustAGroupName");
consumer.subscribe("JustATopic", "TagA");
```

生产者设置自定义属性，用于SQL查询：

```java
message.putUserProperty("JustAName", "JustAValue");
```

消费者使用SQL查询Tag和自定义属性：

```java
consumer.subscribe("JustATopic", MessageSelector.bySql("TAGS is not null and TAGS in ('TagA' and 'TagB') and (JustAName is not null and JustAName between 0 and 3)"));
```

## 事务

消息队列作为一个中间应用，让原本的代码-代码的程序内调用变成了服务-消息列队-服务横跨两三个程序的调用，过程中可能发生任何问题，因此事务就变成了很重要的一点。
创建方式是先实现TransactionListener事务监听器类，再使用TransactionMQProducer创建生产者，添加事务监听器类，并用sendMessageInTransaction发送消息和TransactionSendResult接收结果。
事务监听器类的作用是用于决定事务是否成功，broker在接受到sendMessageInTransaction发送的消息后，会将其暂存到“半消息主题”区，之后回访这个事务监听器，等接收到提交的信号或者经历15次回访都是没状态才真正将消息从“半消息主题”移动到真正的消息主题里；反之如果接收到回滚的信号则丢弃该”半消息“。
注意RocketMQ的事务消息不支持延时和批量。

```java
public class TransactionListenerImpl implements TransactionListener {
    //  对所有消息的首次回查事务是否正常，此时根据情况可以暂时返回无状态
    @Override
    public LocalTransactionState executeLocalTransaction(Message message, Object o) {
        String tags = message.getTags();
        if (StringUtils.contains("JustATag", tags)) {
            return LocalTransactionState.COMIT_MESSAGE;
        }
        if (StringUtils.contains("SomeThingWrong", tags)) {
            return LocalTransactionSTate.ROLLBACK_MESSAGE;
        }
        return LocalTransactionSTate.UNKNOW;
    }
    
    //  对无状态消息的定时回查方法
    @Override
    public LocalTransactionSTate checkLocalTransaction(MessageExt messageExt) {
        String tags = messageExt.getTags();
        if (StringUtils.contains("JustATag", tags)) {
            return LocalTransactionState.COMIT_MESSAGE;
        }
        if (StringUtils.contains("SomeThingWrong", tags)) {
            return LocalTransactionSTate.ROLLBACK_MESSAGE;
        }
        return LocalTransactionSTate.UNKNOW;
    }
}

public class TheTransaction {
    public static void start() {
        TransactionMQProducer producer = new TransactionMQProducer("JustAGroupName");
        //  addThreadInTransaction(producer)    //  可以开启线程提升性能
        producer.addTransactionListener(new TransactionListenerImpl());
        Message message = new Message("JustATopic", "JustATag", "Some content".getBytes(Standard.UTF_8));
        TransactionSendResult transactionsendResult = producer.sendMessageInTransaction(message, null);
    }
    
    public static void addThreadInMQProducer(TransactionMQProducer producer) {
        ThreadPoolExecutor threadPoolExecutor = new ThreadPoolExecutor(2, 5, 100, TimeUnit.SECONDS, new ArrayBlockingQueue<>(2000, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setName("JustExecutorServiceName");
                return thread;
            }
        }));
        producer.addExecutorService(threadPoolExecutor);
    }
}
```

# 如何保证消息不丢失

消息存储过程：
* 异步刷盘，broker接收到消息后存在内存后就返回成功，之后再存到硬盘
* 同步刷盘，broker接收到消息后先存到硬盘，之后再返回成功

# 如何存储和保证检索速度

多个消息直接利用offset偏移量存储到同一个文件中，超过1G则另外新文件。
同时维护另一个索引值对应偏移量、标签对应索引值的列表，来确保可以根据需要进行范围查询或者筛选过滤查询。