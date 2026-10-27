package com.echora.auth.service;

import com.echora.auth.dto.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * ============================================================================
 * INTERFACE DỊCH VỤ QUẢN TRỊ NGƯỜI DÙNG (Admin User Service Interface)
 * ============================================================================
 * 
 * Nghiệp vụ quản trị tài khoản người dùng: danh sách, chi tiết, đổi vai trò, trạng thái và gói dịch vụ.
 *
 * Mọi quy tắc an toàn được cưỡng chế ở tầng này (không chỉ ở giao diện):
 * - Không tự đổi vai trò/trạng thái của chính mình.
 * - Không hạ cấp hoặc khóa ADMIN đang hoạt động cuối cùng.
 * - Thu hồi toàn bộ refresh token khi khóa hoặc hạ cấp.
 * - [Mới] Cập nhật gói tài khoản Premium / Free có ghi nhận thời hạn và audit log.
 * ============================================================================
 */
public interface AdminUserService {

    default Page<AdminUserResponse> listUsers(String search, String role, String status, Pageable pageable) {
        return listUsers(search, role, status, null, pageable);
    }

    /**
     * Lấy danh sách người dùng kèm bộ lọc gói tài khoản (plan: FREE/PREMIUM).
     */
    Page<AdminUserResponse> listUsers(String search, String role, String status, String plan, Pageable pageable);

    /**
     * Xem chi tiết thông tin và gói dịch vụ của người dùng theo ID.
     */
    AdminUserResponse getUser(Long id);

    /**
     * Thay đổi vai trò (USER <-> ADMIN).
     */
    AdminUserResponse changeRole(Long actorId, Long targetId, String role);

    /**
     * Thay đổi trạng thái tài khoản (ACTIVE <-> BLOCKED).
     */
    AdminUserResponse changeStatus(Long actorId, Long targetId, String status);

    /**
     * Thay đổi gói dịch vụ người dùng (FREE <-> PREMIUM) kèm thời hạn tính theo ngày.
     */
    AdminUserResponse changePlan(Long actorId, Long targetId, String plan, Integer durationDays);
}
