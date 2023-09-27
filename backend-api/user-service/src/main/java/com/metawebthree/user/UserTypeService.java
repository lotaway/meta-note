package com.metawebthree.user;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.List;

@Service
public class UserTypeService extends ServiceImpl<UserTypeMapper, UserPojo> {

    private final UserTypeMapper userTypeMapper;

    public UserTypeService(UserTypeMapper userTypeMapper) {
        this.userTypeMapper = userTypeMapper;
    }

    public List<UserPojo> getList() {
//        MPJLambdaWrapper<UserPojo> wrapper = new MPJLambdaWrapper<>();
//        wrapper.select(UserPojo::getId);
        return userTypeMapper.selectList(null);
    }

    public void testNIO(String path) throws IOException {
        FileChannel fc = new FileInputStream(new File(path)).getChannel();
        ByteBuffer buf = ByteBuffer.allocate(48);
        int result;
        while ((result = fc.read(buf)) != 0) {
            System.out.println(result);
        }
    }
}