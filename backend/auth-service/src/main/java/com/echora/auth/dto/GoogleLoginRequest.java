package com.echora.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Yêu cầu đăng nhập Google: chứa ID token (credential) do Google Identity Services
 * trả về ở phía trình duyệt. Không chứa mật khẩu hay client secret.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleLoginRequest {

    @NotBlank(message = "Thiếu thông tin đăng nhập Google.")
    @Size(max = 8192, message = "Thông tin đăng nhập Google không hợp lệ.")
    private String credential;
}
