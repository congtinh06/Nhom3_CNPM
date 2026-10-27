package com.echora.auth.service;

import com.echora.auth.dto.AdminUserResponse;
import com.echora.auth.entity.RefreshToken;
import com.echora.auth.entity.User;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.entity.UserPlan;
import com.echora.auth.exception.BadRequestException;
import com.echora.auth.exception.ForbiddenException;
import com.echora.auth.exception.NotFoundException;
import com.echora.auth.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * ============================================================================
 * TRIỂN KHAI DỊCH VỤ QUẢN TRỊ NGƯỜI DÙNG (Admin User Service Implementation)
 * ============================================================================
 * 
 * Mục đích:
 * - Thực thi các nghiệp vụ quản lý người dùng: tra cứu phân trang, đổi vai trò, đổi trạng thái và nâng cấp gói.
 * - Cưỡng chế các ràng buộc an toàn nghiệp vụ (không tự khóa chính mình, không khóa admin cuối cùng).
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [listUsers]: Bổ sung vị từ `cb.equal(root.get("plan"), planFilter)` để lọc người dùng theo gói FREE / PREMIUM.
 * 2. [changePlan]: Xử lý cập nhật gói người dùng trực tiếp bởi Admin:
 *    - Gói PREMIUM: Tính thời điểm hết hạn `now.plusDays(durationDays)` (mặc định 365 ngày), đánh dấu nguồn `ADMIN_MANUAL_{actorId}`.
 *    - Gói FREE: Xóa thời hạn hết hạn và mã đơn nguồn.
 *    - Ghi nhận lịch sử thay đổi vào bảng audit log qua `adminAuditService.record(...)`.
 * ============================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    static final String SELF_CHANGE_MESSAGE =
            "Bạn không thể tự thay đổi vai trò hoặc trạng thái của chính mình.";
    static final String LAST_ADMIN_MESSAGE =
            "Không thể hạ cấp hoặc khóa quản trị viên đang hoạt động cuối cùng của hệ thống.";
    static final String INVALID_ROLE_MESSAGE =
            "Vai trò không hợp lệ. Chỉ chấp nhận USER hoặc ADMIN.";
    static final String INVALID_STATUS_MESSAGE =
            "Trạng thái không hợp lệ. Chỉ chấp nhận PENDING, ACTIVE hoặc BLOCKED.";

    static final String INVALID_PLAN_MESSAGE =
            "Gói tài khoản không hợp lệ. Chỉ chấp nhận FREE hoặc PREMIUM.";

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final AdminAuditService adminAuditService;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(String search, String role, String status, String plan, Pageable pageable) {
        UserRole roleFilter = parseRole(role, true);
        UserStatus statusFilter = parseStatus(status, true);
        UserPlan planFilter = parsePlan(plan, true);
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim().toLowerCase(Locale.ROOT);

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (normalizedSearch != null) {
                String like = "%" + normalizedSearch + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("fullName")), like)));
            }
            if (roleFilter != null) {
                predicates.add(cb.equal(root.get("role"), roleFilter));
            }
            if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }
            if (planFilter != null) {
                predicates.add(cb.equal(root.get("plan"), planFilter));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(AdminUserResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUser(Long id) {
        return AdminUserResponse.from(findUser(id));
    }

    @Override
    @Transactional
    public AdminUserResponse changeRole(Long actorId, Long targetId, String role) {
        UserRole newRole = parseRole(role, false);
        User target = findUser(targetId);

        if (actorId != null && actorId.equals(targetId)) {
            throw new ForbiddenException(SELF_CHANGE_MESSAGE);
        }

        UserRole oldRole = target.getRole();
        if (oldRole == newRole) {
            return AdminUserResponse.from(target);
        }

        boolean demotingActiveAdmin = oldRole == UserRole.ADMIN
                && newRole == UserRole.USER
                && isLastActiveAdmin(target);
        if (demotingActiveAdmin) {
            throw new ForbiddenException(LAST_ADMIN_MESSAGE);
        }

        target.setRole(newRole);
        target.setUpdatedAt(LocalDateTime.now());
        userRepository.save(target);
        adminAuditService.record(actorId, targetId, "role", oldRole.name(), newRole.name());

        // Hạ cấp khỏi ADMIN -> thu hồi toàn bộ refresh token trong cùng giao dịch
        if (oldRole == UserRole.ADMIN && newRole == UserRole.USER) {
            refreshTokenService.revokeAllForUser(targetId, RefreshToken.REASON_ROLE_CHANGED);
        }

        log.info("ADMIN đổi vai trò userId={} từ {} sang {}", targetId, oldRole, newRole);
        return AdminUserResponse.from(target);
    }

    @Override
    @Transactional
    public AdminUserResponse changeStatus(Long actorId, Long targetId, String status) {
        UserStatus newStatus = parseStatus(status, false);
        User target = findUser(targetId);

        if (actorId != null && actorId.equals(targetId)) {
            throw new ForbiddenException(SELF_CHANGE_MESSAGE);
        }

        UserStatus oldStatus = target.getStatus();
        if (oldStatus == newStatus) {
            return AdminUserResponse.from(target);
        }

        if (newStatus == UserStatus.BLOCKED && isLastActiveAdmin(target)) {
            throw new ForbiddenException(LAST_ADMIN_MESSAGE);
        }

        target.setStatus(newStatus);
        target.setUpdatedAt(LocalDateTime.now());
        userRepository.save(target);
        adminAuditService.record(actorId, targetId, "status", oldStatus.name(), newStatus.name());

        // Khóa tài khoản -> thu hồi toàn bộ refresh token trong cùng giao dịch
        if (newStatus == UserStatus.BLOCKED) {
            refreshTokenService.revokeAllForUser(targetId, RefreshToken.REASON_STATUS_CHANGED);
        }

        log.info("ADMIN đổi trạng thái userId={} từ {} sang {}", targetId, oldStatus, newStatus);
        return AdminUserResponse.from(target);
    }

    @Override
    @Transactional
    public AdminUserResponse changePlan(Long actorId, Long targetId, String plan, Integer durationDays) {
        UserPlan newPlan = parsePlan(plan, false);
        User target = findUser(targetId);
        UserPlan oldPlan = target.getPlan();

        LocalDateTime now = LocalDateTime.now();
        if (newPlan == UserPlan.PREMIUM) {
            int days = durationDays != null && durationDays > 0 ? durationDays : 365;
            LocalDateTime expiresAt = now.plusDays(days);
            target.setPlan(UserPlan.PREMIUM);
            target.setPremiumExpiresAt(expiresAt);
            target.setPremiumSourceOrderCode("ADMIN_MANUAL_" + (actorId != null ? actorId : "SYSTEM"));
        } else {
            target.setPlan(UserPlan.FREE);
            target.setPremiumExpiresAt(null);
            target.setPremiumSourceOrderCode(null);
        }
        target.setUpdatedAt(now);
        userRepository.save(target);
        adminAuditService.record(actorId, targetId, "plan", oldPlan.name(), newPlan.name());

        log.info("ADMIN actorId={} đổi gói userId={} từ {} sang {}", actorId, targetId, oldPlan, newPlan);
        return AdminUserResponse.from(target);
    }

    private User findUser(Long id) {
        if (id == null) {
            throw new NotFoundException("Không tìm thấy người dùng.");
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng."));
    }

    /**
     * Đúng khi người dùng là ADMIN đang ACTIVE và là quản trị viên hoạt động duy nhất.
     * Việc hạ cấp hoặc khóa người này sẽ khiến hệ thống mất toàn bộ quyền quản trị.
     */
    private boolean isLastActiveAdmin(User target) {
        if (target.getRole() != UserRole.ADMIN || target.getStatus() != UserStatus.ACTIVE) {
            return false;
        }
        return userRepository.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE) <= 1;
    }

    private UserRole parseRole(String raw, boolean blankAsNull) {
        if (raw == null || raw.isBlank()) {
            if (blankAsNull) {
                return null;
            }
            throw new BadRequestException(INVALID_ROLE_MESSAGE);
        }
        try {
            return UserRole.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(INVALID_ROLE_MESSAGE);
        }
    }

    private UserStatus parseStatus(String raw, boolean blankAsNull) {
        if (raw == null || raw.isBlank()) {
            if (blankAsNull) {
                return null;
            }
            throw new BadRequestException(INVALID_STATUS_MESSAGE);
        }
        try {
            return UserStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(INVALID_STATUS_MESSAGE);
        }
    }

    private UserPlan parsePlan(String raw, boolean blankAsNull) {
        if (raw == null || raw.isBlank()) {
            if (blankAsNull) {
                return null;
            }
            throw new BadRequestException(INVALID_PLAN_MESSAGE);
        }
        try {
            return UserPlan.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(INVALID_PLAN_MESSAGE);
        }
    }
}
