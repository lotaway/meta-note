package com.metawebthree.email;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/email")
public class EmailController {
    @PostMapping("/sendto")
    String sendTo(@RequestParam String from, @RequestParam String to, @RequestParam String title, @RequestParam String content) {
        return "";
    }
}
