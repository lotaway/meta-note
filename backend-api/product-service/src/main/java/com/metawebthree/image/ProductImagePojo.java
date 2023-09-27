package com.metawebthree.image;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("product_image")
public class ProductImagePojo {
    private Integer id;
    private String imageId;
    private Integer productId;
    private String url;
}
