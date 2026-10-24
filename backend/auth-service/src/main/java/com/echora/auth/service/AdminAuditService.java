package com.echora.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Ghi nhật ký thao tác quản trị (ai đổi gì, của ai, từ giá trị nào sang giá trị nào).
 *
 * <p>Chỉ ghi các trường nghiệp vụ không nhạy cảm (role, status) dưới dạng log có cấu trúc.
 * Tuyệt đối không ghi mật khẩu, hash mật khẩu, token hay bất kỳ bí mật nào.</p>
 */
@Service
@Slf4j
public class AdminAuditService {

    public void record(Long actorId, Long targetId, String field, String oldValue, String newValue) {
        log.info("ADMIN_AUDIT actorId={} targetId={} field={} old={} new={}",
                actorId, targetId, field, oldValue, newValue);
    }
}
