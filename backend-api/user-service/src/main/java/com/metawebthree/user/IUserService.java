package com.metawebthree.user;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.github.yulichang.wrapper.MPJLambdaWrapper;

public interface IUserService extends IService<UserPojo> {
    IPage<UserPojo> getUserList(int pageNum);

    IPage<UserPojo> getUserList(int pageNum, int pageSize);

    IPage<UserPojo> getUserList(Integer pageNum, UserPojo userPojo, Integer pageSize);

    IPage<UserPojo> getUserList(Integer pageNum, MPJLambdaWrapper<UserPojo> wrapper);

    IPage<UserPojo> getUserList(Integer pageNum, MPJLambdaWrapper<UserPojo> wrapper, Integer pageSize);

    int createUser(String email, String password);

    int createUser(String email, String password, Short typeId);

    default int updateUser(Integer id) {
        UserPojo user = new UserPojo();
        user.setId(id);
//        userMapper.updateUserInfo(user);
        return 0;
    }

    boolean deleteUser(Integer id);

    boolean deleteUsers(Integer[] ids);
}
