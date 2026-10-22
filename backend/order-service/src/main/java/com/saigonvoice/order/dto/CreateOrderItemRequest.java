package com.saigonvoice.order.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemRequest {

    @NotNull(message = "productId không được để trống")
    @Positive(message = "productId không hợp lệ")
    private Long productId;

    @NotNull(message = "quantity không được để trống")
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    @Max(value = 99, message = "Số lượng tối đa là 99")
    private Integer quantity;
}
