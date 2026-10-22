package com.saigonvoice.order.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePremiumOrderRequest {

    @Size(max = 40, message = "Ma goi Premium toi da 40 ky tu")
    private String packageCode;
}
