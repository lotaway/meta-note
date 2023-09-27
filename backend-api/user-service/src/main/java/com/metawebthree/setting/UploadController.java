package com.metawebthree.setting;

import com.metawebthree.common.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/upload")
public class UploadController {

    @PostMapping("/file")
    public ApiResponse file(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        try {
            File destFile = new File("/upload/file/" + fileName);
            FileUtils.writeByteArrayToFile(destFile, file.getBytes());
        } catch (IOException e) {
            return ApiResponse.error(e);
        }
        return ApiResponse.success();
    }
}
