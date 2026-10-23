package com.saigonvoice.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QrScanRequest {

    @NotBlank(message = "Ma QR khong hop le.")
    @Size(max = 128, message = "Ma QR khong hop le.")
    private String qrToken;
}
