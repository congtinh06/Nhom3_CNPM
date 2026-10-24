package com.echora.auth.security;

import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;

/**
 * Thông tin người dùng lấy từ access token, đặt vào SecurityContext.
 * Không truy vấn database trên mỗi request để giữ latency thấp.
 */
public record UserPrincipal(Long id, String email, UserRole role, UserStatus status) implements Serializable {

    public Collection<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}
