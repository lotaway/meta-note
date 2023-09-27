package com.metawebthree.image;

import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProductImageMapper extends MPJBaseMapper<ProductImagePojo> {
    @Insert("insert into product_image (product_id, image_id, url) values (#{productId}, #{imageId}, #{url})")
    public int insert(ProductImagePojo productImagePojo);
}
