package com.metawebthree.base;

import org.apache.rocketmq.client.consumer.DefaultMQPushConsumer;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyContext;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyStatus;
import org.apache.rocketmq.client.consumer.listener.MessageListener;
import org.apache.rocketmq.client.consumer.listener.MessageListenerConcurrently;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.common.message.MessageExt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.annotation.Nullable;
import java.util.Arrays;
import java.util.List;

@Configuration
public class MQConsumer {
    private final DefaultMQPushConsumer consumer;
    @Value("rocketmq.client.namesrv")
    private String namesrv;

    public MQConsumer() {
        consumer = new DefaultMQPushConsumer("MQConsumer");
    }

    public void start(String topic, MessageListener messageListener, @Nullable String subExpression) throws MQClientException {
        consumer.setNamesrvAddr(namesrv);
        if (subExpression == null) {
            subExpression = "*";
        }
        consumer.subscribe(topic, subExpression);
        consumer.setMessageListener(messageListener);
        consumer.start();
    }

    public void test() throws MQClientException {
        start("JustATopic", new MessageListenerConcurrently() {
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> list, ConsumeConcurrentlyContext consumeConcurrentlyContext) {
                for (int i = 0; i < list.size(); i++) {
                    MessageExt msg = list.get(i);
                    System.out.printf("Message: %d, %s", i, Arrays.toString(msg.getBody()));
                }
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        }, null);
    }

    public void end() {
        consumer.shutdown();
    }
}
