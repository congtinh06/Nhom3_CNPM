package com.saigonvoice.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    /** Số giây access token còn hiệu lực, client dùng để chủ động refresh. */
    private long expiresIn;
    private String tokenType;
    private UserResponse user;
}
