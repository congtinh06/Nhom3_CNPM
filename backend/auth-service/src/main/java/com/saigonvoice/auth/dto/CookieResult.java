package com.saigonvoice.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Duration;

/**
 * Kết quả login/refresh: access token + refresh token gốc (để controller gắn cookie HttpOnly)
 * cùng thời gian sống của cookie.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CookieResult {

    private String rawRefreshToken;
    private Duration refreshTtl;
    private AuthResponse body;
}
