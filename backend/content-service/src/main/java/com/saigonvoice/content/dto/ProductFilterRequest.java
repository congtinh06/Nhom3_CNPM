package com.saigonvoice.content.dto;

import com.saigonvoice.content.entity.ProductCategory;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {

    private String keyword;
    private Long categoryId;
    private ProductCategory category;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double rating;

    @Builder.Default
    @Min(0)
    private Integer page = 0;

    @Builder.Default
    @Min(1)
    private Integer size = 12;

    @Builder.Default
    private String sortBy = "popular"; // popular, price-asc, price-desc, rating-desc, newest
}
