package com.saigonvoice.auth.controller;

import com.saigonvoice.auth.dto.AdminUserResponse;
import com.saigonvoice.auth.dto.UpdateUserRoleRequest;
import com.saigonvoice.auth.dto.UpdateUserStatusRequest;
import com.saigonvoice.auth.exception.UnauthorizedException;
import com.saigonvoice.auth.security.UserPrincipal;
import com.saigonvoice.auth.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.data.domain.Sort;

/**
 * Quản trị tài khoản người dùng. Toàn bộ đường dẫn nằm dưới {@code /api/auth/admin/**}
 * nên vừa được gateway chặn (Bearer JWT + ADMIN), vừa được SecurityConfig cưỡng chế
 * {@code hasRole('ADMIN')} và {@code @PreAuthorize} ở tầng phương thức.
 */
@RestController
@RequestMapping("/api/auth/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20)
            @SortDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminUserService.listUsers(search, role, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUser(id));
    }

    @RequestMapping(path = "/{id}/role", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> changeRole(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(adminUserService.changeRole(currentUserId(), id, request.getRole()));
    }

    @RequestMapping(path = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> changeStatus(@PathVariable Long id,
                                                          @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminUserService.changeStatus(currentUserId(), id, request.getStatus()));
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return principal.id();
    }
}
