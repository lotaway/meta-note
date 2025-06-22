package com.metawebthree.common.utils;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.Arrays;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Configuration;

@Configuration
public class TelegramAuth {
    private String token;

    public boolean validatyLogin(String authData, String hash) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKey secretKey1 = new SecretKeySpec(token.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey1);
            byte[] key = mac.doFinal(token.getBytes(StandardCharsets.UTF_8));
            SecretKey secretKey2 = new SecretKeySpec(key, "HmacSHA256");
            mac.init(secretKey2);
            TreeMap<String, String> map = new TreeMap<>(
                    Arrays.stream(authData.split("&"))
                            .map(s -> s.split("="))
                            .collect(Collectors.toMap(s -> s[0], s -> s[1])));
            String dataStr = map.entrySet()
                    .stream()
                    .map(entry -> entry.getKey() + "=" + entry.getValue())
                    .collect(Collectors.joining("&"));
            byte[] data = mac.doFinal(dataStr.getBytes(StandardCharsets.UTF_8));
            String calcHash = Base64.getEncoder().encodeToString(data);
            return calcHash.equalsIgnoreCase(hash);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return false;
        } catch (InvalidKeyException e) {
            e.printStackTrace();
            return false;
        }
    }
}
