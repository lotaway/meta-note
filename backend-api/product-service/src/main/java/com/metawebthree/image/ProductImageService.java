package com.metawebthree.image;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

@Service
public class ProductImageService extends ServiceImpl<ProductImageMapper, ProductImagePojo> {

    ProductImageMapper productImageMapper;

    public ProductImageService(ProductImageMapper productImageMapper) {
        this.productImageMapper = productImageMapper;
    }

    public int create(Integer productId, String imageId, String url) {
        ProductImagePojo productImagePojo = new ProductImagePojo();
        productImagePojo.setProductId(productId);
        productImagePojo.setImageId(imageId);
        productImagePojo.setUrl(url);
        return productImageMapper.insert(productImagePojo);
    }
}
