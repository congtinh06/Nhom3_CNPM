package com.antiphishing.linkverification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyRequest {

    @NotBlank(message = "URL không được để trống")
    @URL(protocol = "http|https", message = "URL phải hợp lệ và bắt đầu bằng http:// hoặc https://")
    private String url;
}
