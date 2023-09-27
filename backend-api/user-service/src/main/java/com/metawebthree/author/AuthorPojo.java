package com.metawebthree.author;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("Author")
public class AuthorPojo {
    private Integer id;
    private String realName;
    private Boolean isEnable;
}
