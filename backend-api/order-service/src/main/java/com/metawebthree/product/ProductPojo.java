package com.metawebthree.product;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("product")
public class ProductPojo {
    private Integer id;
    private String name;
    private String description;
    private Integer[] imageIds;
}