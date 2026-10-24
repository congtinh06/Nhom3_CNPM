package com.echora.auth.service;

import com.echora.auth.dto.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Nghiệp vụ quản trị tài khoản người dùng (danh sách, chi tiết, đổi vai trò/trạng thái).
 *
 * <p>Mọi quy tắc an toàn được cưỡng chế ở tầng này (không chỉ ở giao diện):
 * không tự đổi vai trò/trạng thái của chính mình, không hạ cấp hoặc khóa ADMIN đang
 * hoạt động cuối cùng, và thu hồi toàn bộ refresh token khi khóa hoặc hạ cấp.</p>
 */
public interface AdminUserService {

    Page<AdminUserResponse> listUsers(String search, String role, String status, Pageable pageable);

    AdminUserResponse getUser(Long id);

    AdminUserResponse changeRole(Long actorId, Long targetId, String role);

    AdminUserResponse changeStatus(Long actorId, Long targetId, String status);
}
