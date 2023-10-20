package com.metawebthree.base;

import org.apache.rocketmq.client.exception.MQBrokerException;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.SendCallback;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.remoting.exception.RemotingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.annotation.Nullable;
import java.nio.charset.StandardCharsets;

@Configuration
public class MQProducer {
    private final DefaultMQProducer producer;
    @Value("rocketmq.client.namesrv")
    public String namesrv;

    MQProducer() {
        producer = new DefaultMQProducer("MQProducer");
        producer.setNamesrvAddr(namesrv);
    }

    public void start() throws MQClientException {
        producer.start();
    }

    public void test() throws MQClientException, MQBrokerException, RemotingException, InterruptedException {
        SendResult sendResult = send("justATopic", "Hello, this is a test message", "test");
        System.out.println(sendResult);
    }

    public SendResult send(String topic) throws MQBrokerException, RemotingException, InterruptedException, MQClientException {
        return send(topic, "", null);
    }

    public SendResult send(String topic, String content) throws MQBrokerException, RemotingException, InterruptedException, MQClientException {
        return send(topic, content, null);
    }

    public SendResult send(String topic, String content, @Nullable String tags) throws MQBrokerException, RemotingException, InterruptedException, MQClientException {
        Message message = new Message(topic, tags, content.getBytes(StandardCharsets.UTF_8));
        return producer.send(message);
    }

    public void send(String topic, String content, @Nullable String tags, @Nullable SendCallback sendCallback) throws RemotingException, InterruptedException, MQClientException {
        Message message = new Message(topic, tags, content.getBytes(StandardCharsets.UTF_8));
        if (sendCallback == null) {
            sendCallback = new SendCallback() {
                @Override
                public void onSuccess(SendResult sendResult) {
                    System.out.println("Success result: " + sendResult);
                }

                @Override
                public void onException(Throwable throwable) {
                    System.out.println(throwable.getStackTrace());
                }
            };
        }
        producer.send(message, sendCallback);
    }

    public void end() {
        producer.shutdown();
    }
}
