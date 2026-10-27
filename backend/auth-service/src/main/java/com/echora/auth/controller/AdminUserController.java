package com.echora.auth.controller;

import com.echora.auth.dto.AdminUserResponse;
import com.echora.auth.dto.UpdateUserRoleRequest;
import com.echora.auth.dto.UpdateUserStatusRequest;
import com.echora.auth.dto.UpdateUserPlanRequest;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.security.UserPrincipal;
import com.echora.auth.service.AdminUserService;
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
 * ============================================================================
 * QUẢN TRỊ VIÊN: BỘ ĐIỀU KHIỂN NGƯỜI DÙNG (Admin User Controller)
 * ============================================================================
 * 
 * Mục đích:
 * - Tiếp nhận và xử lý toàn bộ các yêu cầu quản trị tài khoản người dùng từ Admin Dashboard.
 * - Toàn bộ endpoint nằm dưới `/api/auth/admin/users/**`, yêu cầu quyền hạn ADMIN.
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Lọc theo gói Plan]: Phương thức `listUsers` bổ sung `@RequestParam(required = false) String plan`
 *    để cho phép quản trị viên lọc người dùng theo gói FREE hoặc PREMIUM.
 * 2. [Cập nhật gói tài khoản]: Bổ sung endpoint `changePlan` (`PATCH /api/auth/admin/users/{id}/plan`)
 *    cho phép quản trị viên trực tiếp kích hoạt/gia hạn Premium hoặc hạ gói người dùng.
 * ============================================================================
 */
@RestController
@RequestMapping("/api/auth/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * Lấy danh sách người dùng có phân trang, tìm kiếm theo tên/email, và lọc theo vai trò, trạng thái, gói tài khoản.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plan,
            @PageableDefault(size = 20)
            @SortDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminUserService.listUsers(search, role, status, plan, pageable));
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

    @RequestMapping(path = "/{id}/plan", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> changePlan(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateUserPlanRequest request) {
        return ResponseEntity.ok(adminUserService.changePlan(currentUserId(), id, request.getPlan(), request.getDurationDays()));
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return principal.id();
    }
}
