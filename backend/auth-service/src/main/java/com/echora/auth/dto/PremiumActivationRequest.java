package com.echora.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PremiumActivationRequest {

    @NotBlank
    @Size(max = 64)
    private String orderCode;

    private LocalDateTime expiresAt;
}
