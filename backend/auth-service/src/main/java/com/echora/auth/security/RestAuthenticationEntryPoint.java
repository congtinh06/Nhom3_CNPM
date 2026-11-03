package com.echora.auth.security;

import com.echora.auth.exception.ProblemDetailWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Trả ProblemDetail (RFC 7807) thống nhất khi request thiếu/hỏng access token.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        ProblemDetailWriter.write(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    }
}
