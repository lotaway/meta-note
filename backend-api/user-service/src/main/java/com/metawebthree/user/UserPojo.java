package com.metawebthree.user;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("User")
public class UserPojo {
    private Integer id;
    private String email;
    private String password;
    private Integer authorId;
    private Short typeId;
}
