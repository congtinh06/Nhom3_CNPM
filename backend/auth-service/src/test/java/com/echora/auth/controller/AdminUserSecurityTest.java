package com.echora.auth.controller;

import com.echora.auth.config.SecurityConfig;
import com.echora.auth.dto.AdminUserResponse;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.security.JwtAuthenticationFilter;
import com.echora.auth.security.RestAccessDeniedHandler;
import com.echora.auth.security.RestAuthenticationEntryPoint;
import com.echora.auth.security.UserPrincipal;
import com.echora.auth.service.AdminUserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bảo vệ hồi quy cho quy tắc {@code /api/auth/admin/** -> hasRole('ADMIN')} trong SecurityConfig.
 * Dùng đúng SecurityConfig thật + entry point / access denied handler thật, chỉ thay JWT filter
 * bằng mock (đi qua chuỗi filter) và mock service nghiệp vụ.
 */
@WebMvcTest(controllers = AdminUserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class AdminUserSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void passThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            ServletRequest request = invocation.getArgument(0);
            ServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    private org.springframework.security.core.Authentication auth(Long id, UserRole role) {
        UserPrincipal principal = new UserPrincipal(id, "u@echora.local", role, UserStatus.ACTIVE);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.authorities());
    }

    private AdminUserResponse sample() {
        return AdminUserResponse.builder()
                .id(5L).fullName("Người dùng 5").email("u@echora.local")
                .role("USER").status("BLOCKED").provider(AdminUserResponse.PROVIDER_LOCAL)
                .emailVerified(true).createdAt(LocalDateTime.now()).build();
    }

    @Test
    @DisplayName("ADMIN được truy cập danh sách người dùng (200)")
    void adminCanList() throws Exception {
        when(adminUserService.listUsers(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sample())));

        mockMvc.perform(get("/api/auth/admin/users").with(authentication(auth(1L, UserRole.ADMIN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("u@echora.local"));
    }

    @Test
    @DisplayName("USER bị từ chối truy cập khu vực quản trị (403)")
    void userForbiddenOnAdminArea() throws Exception {
        mockMvc.perform(get("/api/auth/admin/users").with(authentication(auth(2L, UserRole.USER))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thực hiện thao tác này."));
    }

    @Test
    @DisplayName("USER không thể đổi vai trò qua API quản trị (403)")
    void userForbiddenOnRoleChange() throws Exception {
        mockMvc.perform(patch("/api/auth/admin/users/5/role")
                        .with(authentication(auth(2L, UserRole.USER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chưa đăng nhập bị trả 401")
    void anonymousUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/admin/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Phiên đăng nhập không hợp lệ hoặc đã hết hạn."));
    }

    @Test
    @DisplayName("ADMIN đổi trạng thái thành công (200)")
    void adminCanChangeStatus() throws Exception {
        when(adminUserService.changeStatus(1L, 5L, "BLOCKED")).thenReturn(sample());

        mockMvc.perform(patch("/api/auth/admin/users/5/status")
                        .with(authentication(auth(1L, UserRole.ADMIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BLOCKED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BLOCKED"));
    }
}
