package com.metawebthree.common;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.security.GeneralSecurityException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;

public class OAuth1Utils {
    private static final String HMAC_SHA1_ALGORITHM = "HmacSHA1";
    private static final String ENCODING = "UTF-8";

    public static Map<String, String> getBaseOauth1Map(String key, String secret) {
        Map<String, String> parameters = new HashMap<>();
        parameters.put("oauth_consumer_key", key);
        parameters.put("oauth_signature_method", "HMAC-SHA1");
        parameters.put("oauth_timestamp", String.valueOf(System.currentTimeMillis() / 1000));
        parameters.put("oauth_nonce", UUID.randomUUID().toString());
        parameters.put("oauth_version", "1.0");
        return parameters;
    }

    public static String generate(String method, String url, Map<String, String> parameters, String consumerSecret, String tokenSecret) throws GeneralSecurityException, UnsupportedEncodingException {
        TreeMap<String, String> sortedParams = new TreeMap<>(parameters);
        String baseString = generateBaseString(method, url, sortedParams);
        return hmacsha1(baseString, consumerSecret + "&");
    }

    private static String generateBaseString(String method, String url, TreeMap<String, String> sortedParams) throws UnsupportedEncodingException {
        StringBuilder paramsBuilder = new StringBuilder();
        for (Map.Entry<String, String> param : sortedParams.entrySet()) {
            paramsBuilder.append(param.getKey()).append("=").append(encode(param.getValue())).append("&");
        }
        String params = paramsBuilder.substring(0, paramsBuilder.length() - 1);
        return method.toUpperCase() + "&" + encode(url) + "&" + encode(params);
    }

    private static String hmacsha1(String data, String key) {
        byte[] byteHMAC = null;
        try {
            Mac mac = Mac.getInstance(HMAC_SHA1_ALGORITHM);
            SecretKeySpec spec = new SecretKeySpec(key.getBytes(), HMAC_SHA1_ALGORITHM);
            mac.init(spec);
            byteHMAC = mac.doFinal(data.getBytes());
        } catch (InvalidKeyException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException ignore) {
        }
        String oauth = Base64.getEncoder().encodeToString(byteHMAC);
        return oauth;
    }

    public static String encode(String value) throws UnsupportedEncodingException {
        return URLEncoder.encode(value, ENCODING);
    }

}
