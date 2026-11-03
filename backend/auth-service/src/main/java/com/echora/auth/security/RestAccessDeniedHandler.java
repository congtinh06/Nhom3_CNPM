package com.echora.auth.security;

import com.echora.auth.exception.ProblemDetailWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Trả ProblemDetail (RFC 7807) 403 khi người dùng đã đăng nhập nhưng thiếu quyền
 * (VD: USER gọi endpoint ADMIN).
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        ProblemDetailWriter.write(response, request, HttpServletResponse.SC_FORBIDDEN,
                "Bạn không có quyền thực hiện thao tác này.");
    }
}
