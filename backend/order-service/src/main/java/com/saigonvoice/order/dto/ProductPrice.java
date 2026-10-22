package com.saigonvoice.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductPrice {
    private Long id;
    private String name;
    private BigDecimal price;
    private Boolean isActive;
}
