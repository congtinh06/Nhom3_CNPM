package com.echora.content.dto;

import com.echora.content.entity.Product;
import com.echora.content.entity.ProductCategory;
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
    private Long categoryId;
    private Long poiId;
    private String poiSlug;
    private BigDecimal rating;
    private Integer reviewsCount;
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
                .categoryId(product.getCategoryEntity() != null ? product.getCategoryEntity().getId() : null)
                .poiId(product.getPoi() != null ? product.getPoi().getId() : null)
                .poiSlug(product.getPoi() != null ? product.getPoi().getSlug() : null)
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
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
