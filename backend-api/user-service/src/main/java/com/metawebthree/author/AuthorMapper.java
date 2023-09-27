package com.metawebthree.author;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.metawebthree.author.AuthorPojo;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuthorMapper extends BaseMapper<AuthorPojo> {

}
