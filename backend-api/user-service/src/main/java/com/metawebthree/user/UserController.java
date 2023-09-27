package com.metawebthree.user;

import com.metawebthree.author.AuthorPojo;
import com.metawebthree.common.utils.SecretUtilsKey;
import com.metawebthree.common.ApiResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/user")
public class UserController {

    private final String subject = "metawebthree";

    //    @Autowired
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/list")
    public ApiResponse<List<UserPojo>> userList(@RequestParam(defaultValue = "1", required = false) Integer pageNum, @RequestParam(required = false) String email, @RequestParam(required = false) Short typeId, @RequestParam(required = false) String realName) {
        UserPojo userPojo = new UserPojo();
        userPojo.setTypeId(typeId);
        userPojo.setEmail(email);
        AuthorPojo authorPojo = new AuthorPojo();
        authorPojo.setRealName(realName);
//        return ApiResponse.success(userService.getUserList(pageNum, wrapper).getRecords());
        return ApiResponse.success(userService.getUserList(pageNum, userPojo, authorPojo).getRecords());
    }

    @PostMapping("/create")
    public ApiResponse create(@RequestBody Map<String, Object> params) {
        Short typeId = (Short) params.get("typeId");
        if (typeId == null)
            typeId = 0;
        int userId = userService.createUser(String.valueOf(params.get("email")), String.valueOf(params.get("password")), typeId);
        LocalDateTime localDateTime = LocalDateTime.now();
        log.info("userId:" + userId + ", date_time:" + localDateTime);
        return ApiResponse.success();
    }

    @RequestMapping("/signIn")
    public ApiResponse signIn(@RequestParam(defaultValue = "0", required = false) Short typeId, @RequestParam String email) throws IOException {
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put("email", email);
        claimsMap.put("typeId", typeId);
        Key key = SecretUtilsKey.getKey("/init_config/sign_in_secret_key.txt");
        String jwt = Jwts.builder().setSubject(subject).signWith(key, SignatureAlgorithm.HS256).setClaims(claimsMap).setExpiration(new Date(System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000)).compact();
        return ApiResponse.success(jwt);
    }

    @RequestMapping("/checkAuth")
    public ApiResponse checkAuth(@RequestParam String jwt) {
        Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(jwt).getBody();
        assert claims.getSubject().equals(subject);
        return ApiResponse.success(claims);
    }
}
