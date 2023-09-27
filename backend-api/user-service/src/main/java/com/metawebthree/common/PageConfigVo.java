package com.metawebthree.common;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "page-config")
public class PageConfigVo {
    private Integer pageSize;
}
