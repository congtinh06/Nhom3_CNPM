package com.saigonvoice.auth.controller;

import com.saigonvoice.auth.dto.QrLoginSessionResponse;
import com.saigonvoice.auth.dto.QrLoginStatsResponse;
import com.saigonvoice.auth.service.QrLoginStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Thống kê QR đăng nhập cho khu vực quản trị.
 * Toàn bộ route nằm dưới /api/auth/admin/** nên đã được gateway + SecurityConfig
 * giới hạn cho ADMIN; @PreAuthorize bổ sung lớp kiểm tra ở method.
 */
@RestController
@RequestMapping("/api/auth/admin/qr")
@RequiredArgsConstructor
public class AdminQrStatsController {

    private final QrLoginStatsService qrLoginStatsService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QrLoginStatsResponse> getStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "day") String bucket) {
        return ResponseEntity.ok(qrLoginStatsService.getStats(from, to, bucket));
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<QrLoginSessionResponse>> getSessions(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(qrLoginStatsService.getSessions(from, to, status, page, size));
    }
}
