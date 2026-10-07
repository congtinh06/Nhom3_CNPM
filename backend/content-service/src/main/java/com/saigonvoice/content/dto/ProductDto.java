package com.saigonvoice.content.dto;

import com.saigonvoice.content.entity.Product;
import com.saigonvoice.content.entity.ProductCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String slug;
    private String name;
    private ProductCategory category;
    private String shortDescription;
    private String description;
    private BigDecimal price;
    private String imagePath;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductDto fromEntity(Product product) {
        if (product == null) {
            return null;
        }
        return ProductDto.builder()
                .id(product.getId())
                .slug(product.getSlug())
                .name(product.getName())
                .category(product.getCategory())
                .shortDescription(product.getShortDescription())
                .description(product.getDescription())
                .price(product.getPrice())
                .imagePath(product.getImagePath())
                .isActive(product.getIsActive())
                .sortOrder(product.getSortOrder())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
