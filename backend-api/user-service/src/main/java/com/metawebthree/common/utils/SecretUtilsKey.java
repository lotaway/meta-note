package com.metawebthree.common.utils;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import org.apache.commons.io.FileUtils;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;

public class SecretUtilsKey {
    public static Key getKey(String path) throws IOException {
        Key key = null;
        File destFile = new File(path);
        String secretKey = FileUtils.readFileToString(destFile, StandardCharsets.UTF_8);
        if (secretKey.equals("")) {
            try {
                key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
            } catch (WeakKeyException e) {
                e.printStackTrace();
            }
        }
        if (key == null) {
            key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            secretKey = Encoders.BASE64.encode(key.getEncoded());
            FileUtils.writeByteArrayToFile(destFile, secretKey.getBytes());
        }
        return key;
    }
}