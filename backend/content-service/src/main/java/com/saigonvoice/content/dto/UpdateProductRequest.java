package com.saigonvoice.content.dto;

import com.saigonvoice.content.entity.ProductCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    @Size(max = 150, message = "Slug tối đa 150 ký tự")
    private String slug;

    @NotNull(message = "Danh mục sản phẩm không được để trống")
    private ProductCategory category;

    @Size(max = 500, message = "Mô tả ngắn tối đa 500 ký tự")
    private String shortDescription;

    private String description;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(value = "0", message = "Giá sản phẩm không được âm")
    private BigDecimal price;

    @Size(max = 500, message = "Đường dẫn ảnh tối đa 500 ký tự")
    private String imagePath;

    private Boolean isActive;

    private Integer sortOrder;
}
