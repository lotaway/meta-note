package com.metawebthree.cloud;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;

@Service
public class S3Service {

    private final S3Client s3Client;

    public S3Service(S3Client s3Client, S3Buckets s3Bucket) {
        this.s3Client = s3Client;
    }

    public S3Client getS3Client() {
        return s3Client;
    }

    public PutObjectResponse putObject(String bucketName, String key, byte[] content) {
        return s3Client.putObject(builder -> builder.bucket(bucketName).key(key), RequestBody.fromBytes(content));
    }

    public PutObjectResponse updateObject(String bucketName, String key, byte[] content) {
        return putObject(bucketName, key, content);
    }

    public byte[] getObject(String bucketName, String key) throws RuntimeException {
        try {
            return s3Client.getObject(builder -> builder.bucket(bucketName).key(key)).readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException("Error while getting object from S3", e);
        }
    }

    public void deleteObject(String bucketName, String key) {
        s3Client.deleteObject(builder -> builder.bucket(bucketName).key(key));
    }
}
