package com.metawebthree.setting;

import org.springframework.stereotype.Repository;

import java.util.Objects;

@Repository
public class ResourceDao {
    public String getFile(String filePath) {
        return Objects.requireNonNull(this.getClass().getClassLoader().getResource(filePath)).getFile();
    }
}
