package com.saigonvoice.auth.service;

import com.saigonvoice.auth.dto.AdminUserResponse;
import com.saigonvoice.auth.entity.RefreshToken;
import com.saigonvoice.auth.entity.User;
import com.saigonvoice.auth.entity.UserRole;
import com.saigonvoice.auth.entity.UserStatus;
import com.saigonvoice.auth.exception.BadRequestException;
import com.saigonvoice.auth.exception.ForbiddenException;
import com.saigonvoice.auth.exception.NotFoundException;
import com.saigonvoice.auth.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AdminAuditService adminAuditService;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User user(Long id, String email, UserRole role, UserStatus status) {
        return User.builder()
                .id(id)
                .fullName("Người dùng " + id)
                .email(email)
                .role(role)
                .status(status)
                .passwordHash("$2a$12$hash")
                .emailVerifiedAt(status == UserStatus.ACTIVE ? LocalDateTime.now() : null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("listUsers: trả về trang DTO, không lộ trường nhạy cảm")
    void listUsersMapsToDto() {
        Pageable pageable = PageRequest.of(0, 20);
        User u = user(1L, "a@saigonvoice.local", UserRole.USER, UserStatus.ACTIVE);
        when(userRepository.findAll(ArgumentMatchers.<Specification<User>>any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(u), pageable, 1));

        Page<AdminUserResponse> result = adminUserService.listUsers("a@", "USER", "ACTIVE", pageable);

        assertThat(result.getContent()).hasSize(1);
        AdminUserResponse dto = result.getContent().get(0);
        assertThat(dto.getEmail()).isEqualTo("a@saigonvoice.local");
        assertThat(dto.getRole()).isEqualTo("USER");
        assertThat(dto.getStatus()).isEqualTo("ACTIVE");
        assertThat(dto.getProvider()).isEqualTo(AdminUserResponse.PROVIDER_LOCAL);
    }

    @Test
    @DisplayName("listUsers: bộ lọc vai trò/trạng thái không hợp lệ -> BadRequestException")
    void listUsersInvalidFilterRejected() {
        Pageable pageable = PageRequest.of(0, 20);
        assertThatThrownBy(() -> adminUserService.listUsers(null, "SUPER", null, pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vai trò không hợp lệ");
        assertThatThrownBy(() -> adminUserService.listUsers(null, null, "GONE", pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Trạng thái không hợp lệ");
    }

    @Test
    @DisplayName("getUser: không tồn tại -> NotFoundException")
    void getUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> adminUserService.getUser(99L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Không tìm thấy người dùng");
    }

    @Test
    @DisplayName("getUser: tài khoản Google-only -> provider GOOGLE")
    void getUserGoogleProvider() {
        User u = User.builder().id(2L).fullName("G").email("g@x.com")
                .role(UserRole.USER).status(UserStatus.ACTIVE).googleSub("sub-123")
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));

        assertThat(adminUserService.getUser(2L).getProvider())
                .isEqualTo(AdminUserResponse.PROVIDER_GOOGLE);
    }

    @Test
    @DisplayName("changeRole: nâng cấp USER -> ADMIN, ghi audit, không thu hồi phiên")
    void changeRolePromote() {
        User target = user(5L, "u@x.com", UserRole.USER, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse result = adminUserService.changeRole(1L, 5L, "ADMIN");

        assertThat(result.getRole()).isEqualTo("ADMIN");
        verify(adminAuditService).record(1L, 5L, "role", "USER", "ADMIN");
        verify(refreshTokenService, never()).revokeAllForUser(anyLong(), any());
    }

    @Test
    @DisplayName("changeRole: hạ cấp ADMIN -> USER thu hồi toàn bộ phiên")
    void changeRoleDemoteRevokesTokens() {
        User target = user(5L, "admin2@x.com", UserRole.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE)).thenReturn(2L);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse result = adminUserService.changeRole(1L, 5L, "USER");

        assertThat(result.getRole()).isEqualTo("USER");
        verify(refreshTokenService).revokeAllForUser(5L, RefreshToken.REASON_ROLE_CHANGED);
        verify(adminAuditService).record(1L, 5L, "role", "ADMIN", "USER");
    }

    @Test
    @DisplayName("changeRole: không thể hạ cấp ADMIN hoạt động cuối cùng")
    void changeRoleLastActiveAdminBlocked() {
        User target = user(5L, "admin@x.com", UserRole.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE)).thenReturn(1L);

        assertThatThrownBy(() -> adminUserService.changeRole(1L, 5L, "USER"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("cuối cùng");

        verify(userRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeAllForUser(anyLong(), any());
    }

    @Test
    @DisplayName("changeRole: không thể tự đổi vai trò của chính mình")
    void changeRoleSelfBlocked() {
        User target = user(1L, "admin@x.com", UserRole.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminUserService.changeRole(1L, 1L, "USER"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("chính mình");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changeStatus: khóa tài khoản thu hồi toàn bộ phiên và ghi audit")
    void changeStatusBlockRevokesTokens() {
        User target = user(5L, "u@x.com", UserRole.USER, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse result = adminUserService.changeStatus(1L, 5L, "BLOCKED");

        assertThat(result.getStatus()).isEqualTo("BLOCKED");
        verify(refreshTokenService).revokeAllForUser(5L, RefreshToken.REASON_STATUS_CHANGED);
        verify(adminAuditService).record(1L, 5L, "status", "ACTIVE", "BLOCKED");
    }

    @Test
    @DisplayName("changeStatus: không thể khóa ADMIN hoạt động cuối cùng")
    void changeStatusLastActiveAdminBlocked() {
        User target = user(5L, "admin@x.com", UserRole.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE)).thenReturn(1L);

        assertThatThrownBy(() -> adminUserService.changeStatus(1L, 5L, "BLOCKED"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("cuối cùng");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changeStatus: kích hoạt lại tài khoản không thu hồi phiên")
    void changeStatusActivateNoRevoke() {
        User target = user(5L, "u@x.com", UserRole.USER, UserStatus.PENDING);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse result = adminUserService.changeStatus(1L, 5L, "ACTIVE");

        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        verify(refreshTokenService, never()).revokeAllForUser(anyLong(), any());
        verify(adminAuditService).record(1L, 5L, "status", "PENDING", "ACTIVE");
    }

    @Test
    @DisplayName("changeStatus: không thể tự đổi trạng thái của chính mình")
    void changeStatusSelfBlocked() {
        User target = user(1L, "admin@x.com", UserRole.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findById(1L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminUserService.changeStatus(1L, 1L, "BLOCKED"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("chính mình");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changeStatus: trạng thái không hợp lệ -> BadRequestException")
    void changeStatusInvalidRejected() {
        assertThatThrownBy(() -> adminUserService.changeStatus(1L, 5L, "DELETED"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Trạng thái không hợp lệ");
        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("changeRole: vai trò không hợp lệ -> BadRequestException")
    void changeRoleInvalidRejected() {
        assertThatThrownBy(() -> adminUserService.changeRole(1L, 5L, "OWNER"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Vai trò không hợp lệ");
    }

    @Test
    @DisplayName("changeStatus: không tồn tại -> NotFoundException")
    void changeStatusNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> adminUserService.changeStatus(1L, 99L, "BLOCKED"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("changeRole: giữ nguyên vai trò và trạng thái khi giá trị không đổi")
    void changeRoleNoopWhenSame() {
        User target = user(5L, "u@x.com", UserRole.USER, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));

        AdminUserResponse result = adminUserService.changeRole(1L, 5L, "USER");

        assertThat(result.getRole()).isEqualTo("USER");
        verify(userRepository, never()).save(any());
        verify(adminAuditService, never()).record(anyLong(), anyLong(), any(), any(), any());
    }

    @Test
    @DisplayName("changeRole: same-role check không gọi countByRoleAndStatus")
    void changeRoleNoopDoesNotCount() {
        User target = user(5L, "a@x.com", UserRole.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));

        adminUserService.changeRole(1L, 5L, "ADMIN");

        verify(userRepository, times(0)).countByRoleAndStatus(any(), any());
    }
}
