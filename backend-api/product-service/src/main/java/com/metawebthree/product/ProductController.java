package com.metawebthree.product;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.util.Arrays;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/product")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/test")
    public String test() {
        productService.createProduct("test.txt", "content for test".getBytes());
        return Arrays.toString(productService.getProduct("test.txt"));
    }

    @PostMapping("/create")
    public String create() {
        productService.createProduct("/product/%s".formatted(UUID.randomUUID().toString()), "create".getBytes());
        return Arrays.toString(productService.getProduct("test.txt"));
    }

    @PutMapping("/update/{id}")
    public String update(@PathVariable Integer id, @RequestParam String content) {
        PutObjectResponse res = productService.updateProduct("/product/%s".formatted(id), content.getBytes());
        return res.toString();
    }

    @DeleteMapping("/delete")
    public boolean delete() {
        productService.deleteProduct("test.txt");
        return true;
    }

    @PostMapping(path = "/product/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public boolean uploadImage(@PathVariable(name = "id") Integer productId, @RequestParam MultipartFile file) {
        return productService.uploadImage(productId, file);
    }

    @GetMapping("/product/{id}/images")
    public byte[] getImage(@PathVariable(name = "id") Integer productId) {
        return productService.getImages(productId);
    }
}