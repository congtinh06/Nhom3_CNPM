package com.antiphishing.linkverification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyRequest {

    @NotBlank(message = "URL không được để trống")
    @Pattern(regexp = "^https?://[^\\s]+$", message = "URL phải hợp lệ và bắt đầu bằng http:// hoặc https://")
    private String url;
}
