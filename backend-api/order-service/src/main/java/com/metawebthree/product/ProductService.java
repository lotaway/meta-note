package com.metawebthree.product;

import com.metawebthree.base.MQProducer;
import com.metawebthree.cloud.S3Buckets;
import com.metawebthree.cloud.S3Service;
import com.metawebthree.image.ProductImageService;
import org.apache.rocketmq.client.exception.MQBrokerException;
import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.remoting.exception.RemotingException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProductService {
    private final S3Service s3Service;
    private final S3Buckets s3Bucket;
    private final MQProducer mqProducer;

    private final ProductImageService productImageService;

    public ProductService(
            S3Service s3Service,
            S3Buckets s3Bucket,
            MQProducer mqProducer,
            ProductImageService productImageService) {
        this.s3Service = s3Service;
        this.s3Bucket = s3Bucket;
        this.mqProducer = mqProducer;
        this.productImageService = productImageService;
    }

    public PutObjectResponse createProduct(String key, byte[] content) {
        return s3Service.putObject(s3Bucket.getProduct(), key, content);
    }

    public PutObjectResponse updateProduct(String key, byte[] content) {
        return s3Service.putObject(s3Bucket.getProduct(), key, content);
    }

    public byte[] getProduct(String key) throws RuntimeException {
        return s3Service.getObject(s3Bucket.getProduct(), key);
    }

    public void deleteProduct(String key)
            throws MQBrokerException, RemotingException, InterruptedException, MQClientException {
        s3Service.deleteObject(s3Bucket.getProduct(), key);
        mqProducer.send("deleteProduct", "delete product with:" + key, null, null);
    }

    public boolean uploadImage(Integer productId, MultipartFile file) {
        String imageId = UUID.randomUUID().toString();
        String url = "/product/%s/images/%s".formatted(productId, imageId);
        try {
            PutObjectResponse res = s3Service.putObject(s3Bucket.getProduct(), url, file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return Integer.valueOf(1).equals(productImageService.create(productId, imageId, url));
    }

    public byte[] getImages(Integer productId) {
        return s3Service.getObject(s3Bucket.getProduct(), "/product/%s/images/".formatted(productId));
    }

    ConcurrentHashMap<Integer, Object> statisticLockMap = new ConcurrentHashMap<>();
    Long count = 0L;

    public boolean updateFeatureStatistic(Integer featureId, Integer increated) {
        return updateFeatureStatisticWithLock(featureId, increated);
    }

    public boolean updateFeatureStatisticWithLock(Integer featureId, Integer increated) {
        Object lock = statisticLockMap.computeIfAbsent(featureId, key -> new Object());
        synchronized (lock) {
            count += increated;
        }
        return true;
    }
}
