package com.echora.content.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductSortOrderRequest {

    @NotNull(message = "Thứ tự sắp xếp không được để trống")
    private Integer sortOrder;
}
