package com.metawebthree.setting;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SettingService {
    @Autowired
    private ResourceDao resourceDao;

    public String getTestConfig() {
        return resourceDao.getFile("static/test.xml");
    }
}
