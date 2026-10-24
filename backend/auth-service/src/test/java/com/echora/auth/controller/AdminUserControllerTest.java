package com.echora.auth.controller;

import com.echora.auth.dto.AdminUserResponse;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.exception.BadRequestException;
import com.echora.auth.exception.ForbiddenException;
import com.echora.auth.exception.GlobalExceptionHandler;
import com.echora.auth.exception.NotFoundException;
import com.echora.auth.security.UserPrincipal;
import com.echora.auth.service.AdminUserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.data.web.SortHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserControllerTest {

    private final AdminUserService adminUserService = mock(AdminUserService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AdminUserController controller = new AdminUserController(adminUserService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(new SortHandlerMethodArgumentResolver()))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        authenticateAs(1L, UserRole.ADMIN);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(Long id, UserRole role) {
        UserPrincipal principal = new UserPrincipal(id, "admin@echora.local", role, UserStatus.ACTIVE);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.authorities()));
    }

    private AdminUserResponse sample(Long id, String email, String role, String status) {
        return AdminUserResponse.builder()
                .id(id).fullName("Người dùng " + id).email(email)
                .role(role).status(status).provider(AdminUserResponse.PROVIDER_LOCAL)
                .emailVerified(true).createdAt(LocalDateTime.now()).build();
    }

    @Test
    @DisplayName("GET /api/auth/admin/users trả trang JSON")
    void listReturnsPage() throws Exception {
        when(adminUserService.listUsers(eq("a@"), eq("USER"), eq("ACTIVE"), any()))
                .thenReturn(new PageImpl<>(List.of(sample(2L, "a@echora.local", "USER", "ACTIVE")),
                        PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/auth/admin/users")
                        .param("search", "a@").param("role", "USER").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("a@echora.local"))
                .andExpect(jsonPath("$.content[0].role").value("USER"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/auth/admin/users/{id} không tồn tại trả 404 kèm thông điệp")
    void detailNotFoundReturns404() throws Exception {
        when(adminUserService.getUser(99L)).thenThrow(new NotFoundException("Không tìm thấy người dùng."));

        mockMvc.perform(get("/api/auth/admin/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy người dùng."));
    }

    @Test
    @DisplayName("PATCH /role đổi vai trò thành công trả 200")
    void changeRoleReturns200() throws Exception {
        when(adminUserService.changeRole(1L, 5L, "ADMIN"))
                .thenReturn(sample(5L, "u@echora.local", "ADMIN", "ACTIVE"));

        mockMvc.perform(patch("/api/auth/admin/users/5/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        verify(adminUserService).changeRole(1L, 5L, "ADMIN");
    }

    @Test
    @DisplayName("PUT /status khóa tài khoản trả 200")
    void changeStatusReturns200() throws Exception {
        when(adminUserService.changeStatus(1L, 5L, "BLOCKED"))
                .thenReturn(sample(5L, "u@echora.local", "USER", "BLOCKED"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/auth/admin/users/5/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BLOCKED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BLOCKED"));
    }

    @Test
    @DisplayName("Vai trò không hợp lệ trả 400 kèm thông điệp")
    void invalidRoleReturns400() throws Exception {
        when(adminUserService.changeRole(1L, 5L, "OWNER"))
                .thenThrow(new BadRequestException("Vai trò không hợp lệ. Chỉ chấp nhận USER hoặc ADMIN."));

        mockMvc.perform(patch("/api/auth/admin/users/5/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"OWNER\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Vai trò không hợp lệ. Chỉ chấp nhận USER hoặc ADMIN."));
    }

    @Test
    @DisplayName("Thiếu trường role trả 400 kèm lỗi theo ô")
    void missingRoleReturns400FieldError() throws Exception {
        mockMvc.perform(patch("/api/auth/admin/users/5/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.role").exists());
    }

    @Test
    @DisplayName("Tự đổi vai trò của chính mình trả 403")
    void selfChangeReturns403() throws Exception {
        when(adminUserService.changeRole(1L, 1L, "USER"))
                .thenThrow(new ForbiddenException("Bạn không thể tự thay đổi vai trò hoặc trạng thái của chính mình."));

        mockMvc.perform(patch("/api/auth/admin/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"USER\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Hạ cấp quản trị viên cuối cùng trả 403")
    void lastAdminReturns403() throws Exception {
        when(adminUserService.changeRole(1L, 9L, "USER"))
                .thenThrow(new ForbiddenException("Không thể hạ cấp hoặc khóa quản trị viên đang hoạt động cuối cùng của hệ thống."));

        mockMvc.perform(patch("/api/auth/admin/users/9/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"USER\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").exists());
    }
}
