package com.echora.auth.service;

import com.echora.auth.dto.QrLoginSessionResponse;
import com.echora.auth.dto.QrLoginStatsResponse;
import com.echora.auth.entity.QrLoginSession;
import com.echora.auth.entity.QrLoginStatus;
import com.echora.auth.entity.User;
import com.echora.auth.exception.BadRequestException;
import com.echora.auth.repository.QrLoginSessionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class QrLoginStatsServiceImpl implements QrLoginStatsService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<QrLoginStatus> LIVE_STATUSES =
            EnumSet.of(QrLoginStatus.PENDING, QrLoginStatus.SCANNED, QrLoginStatus.APPROVED);
    private static final int DEFAULT_RANGE_DAYS = 7;
    private static final int MAX_PAGE_SIZE = 100;

    private final QrLoginSessionRepository qrLoginSessionRepository;

    @Value("${app.qr.stats.max-range-days:30}")
    private int maxRangeDays = 30;

    @Override
    @Transactional(readOnly = true)
    public QrLoginStatsResponse getStats(LocalDate from, LocalDate to, String bucket) {
        RangeBounds range = resolveRange(from, to, bucket);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        List<Object[]> totalRows = qrLoginSessionRepository.findTotals(range.startUtc(), range.endUtc(), now);
        Object[] totalRow = totalRows == null || totalRows.isEmpty() ? null : totalRows.get(0);

        QrLoginStatsResponse.Totals totals = QrLoginStatsResponse.Totals.builder()
                .created(longAt(totalRow, 0))
                .scanned(longAt(totalRow, 1))
                .approved(longAt(totalRow, 2))
                .consumed(longAt(totalRow, 3))
                .denied(longAt(totalRow, 4))
                .expired(longAt(totalRow, 5))
                .cancelled(longAt(totalRow, 6))
                .pending(longAt(totalRow, 7))
                .active(longAt(totalRow, 8))
                .distinctUsers(longAt(totalRow, 9))
                .build();

        QrLoginStatsResponse.Rates rates = QrLoginStatsResponse.Rates.builder()
                .scanRate(percent(totals.getScanned(), totals.getCreated()))
                .approvalRate(percent(totals.getApproved(), totals.getScanned()))
                .successRate(percent(totals.getConsumed(), totals.getCreated()))
                .expiredRate(percent(totals.getExpired(), totals.getCreated()))
                .build();

        List<Object[]> durationRows = qrLoginSessionRepository.findAverageDurations(range.startUtc(), range.endUtc());
        Object[] durationRow = durationRows == null || durationRows.isEmpty() ? null : durationRows.get(0);
        QrLoginStatsResponse.Durations durations = QrLoginStatsResponse.Durations.builder()
                .averageScanSeconds(round1(doubleAt(durationRow, 0)))
                .averageApproveSeconds(round1(doubleAt(durationRow, 1)))
                .averageLoginSeconds(round1(doubleAt(durationRow, 2)))
                .build();

        return QrLoginStatsResponse.builder()
                .range(QrLoginStatsResponse.Range.builder()
                        .from(range.from().toString())
                        .to(range.to().toString())
                        .bucket(range.bucket())
                        .build())
                .totals(totals)
                .rates(rates)
                .durations(durations)
                .series(mapSeries(range, qrLoginSessionRepository.findDailySeries(range.startUtc(), range.endUtc()),
                        qrLoginSessionRepository.findHourlySeries(range.startUtc(), range.endUtc())))
                .statusBreakdown(mapStatusCounts(
                        qrLoginSessionRepository.findEffectiveStatusCounts(range.startUtc(), range.endUtc(), now)))
                .devices(mapDevices(qrLoginSessionRepository.findDeviceCounts(range.startUtc(), range.endUtc())))
                .topUsers(mapTopUsers(qrLoginSessionRepository.findTopUsers(range.startUtc(), range.endUtc())))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QrLoginSessionResponse> getSessions(LocalDate from, LocalDate to,
                                                    String status, int page, int size) {
        RangeBounds range = resolveRange(from, to, "day");
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        QrLoginStatus statusFilter = parseStatus(status);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Specification<QrLoginSession> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), range.startUtc()));
            predicates.add(cb.lessThan(root.get("createdAt"), range.endUtc()));

            if (statusFilter == QrLoginStatus.EXPIRED) {
                predicates.add(cb.or(
                        cb.equal(root.get("status"), QrLoginStatus.EXPIRED),
                        cb.and(
                                root.get("status").in(LIVE_STATUSES),
                                cb.lessThanOrEqualTo(root.get("expiresAt"), now))));
            } else if (statusFilter != null && LIVE_STATUSES.contains(statusFilter)) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
                predicates.add(cb.greaterThan(root.get("expiresAt"), now));
            } else if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        PageRequest pageRequest = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return qrLoginSessionRepository.findAll(specification, pageRequest)
                .map(session -> toSessionResponse(session, now));
    }

    private RangeBounds resolveRange(LocalDate from, LocalDate to, String bucket) {
        LocalDate today = LocalDate.now(APP_ZONE);
        LocalDate effectiveTo = to == null ? today : to;
        LocalDate effectiveFrom = from == null ? effectiveTo.minusDays(DEFAULT_RANGE_DAYS - 1L) : from;

        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc.");
        }
        long days = ChronoUnit.DAYS.between(effectiveFrom, effectiveTo) + 1;
        if (days > maxRangeDays) {
            throw new BadRequestException("Khoảng thời gian tối đa là " + maxRangeDays + " ngày.");
        }

        String normalizedBucket = bucket == null || bucket.isBlank()
                ? "day"
                : bucket.trim().toLowerCase(Locale.ROOT);
        if (!"day".equals(normalizedBucket) && !"hour".equals(normalizedBucket)) {
            throw new BadRequestException("Kiểu nhóm thời gian chỉ hỗ trợ day hoặc hour.");
        }

        return new RangeBounds(
                effectiveFrom,
                effectiveTo,
                normalizedBucket,
                toUtcStart(effectiveFrom),
                toUtcStart(effectiveTo.plusDays(1)));
    }

    private static LocalDateTime toUtcStart(LocalDate date) {
        return date.atStartOfDay(APP_ZONE)
                .withZoneSameInstant(ZoneOffset.UTC)
                .toLocalDateTime();
    }

    private static QrLoginStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return QrLoginStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Trạng thái phiên QR không hợp lệ.");
        }
    }

    private static QrLoginSessionResponse toSessionResponse(QrLoginSession session, LocalDateTime now) {
        User user = session.getUser();
        return QrLoginSessionResponse.builder()
                .id(session.getId())
                .status(effectiveStatus(session, now).name())
                .user(user == null ? null : QrLoginSessionResponse.UserRef.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .build())
                .deviceLabel(QrLoginService.describeDevice(session.getCreatedUserAgent()))
                .createdIp(maskIp(session.getCreatedIp()))
                .approvedIp(maskIp(session.getApprovedIp()))
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .scannedAt(session.getScannedAt())
                .approvedAt(session.getApprovedAt())
                .consumedAt(session.getConsumedAt())
                .scanSeconds(secondsBetween(session.getCreatedAt(), session.getScannedAt()))
                .totalSeconds(secondsBetween(session.getCreatedAt(), session.getConsumedAt()))
                .build();
    }

    private static QrLoginStatus effectiveStatus(QrLoginSession session, LocalDateTime now) {
        if (LIVE_STATUSES.contains(session.getStatus())
                && session.getExpiresAt() != null
                && !session.getExpiresAt().isAfter(now)) {
            return QrLoginStatus.EXPIRED;
        }
        return session.getStatus();
    }

    private static String maskIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return null;
        }
        String trimmed = ip.trim();
        if (trimmed.contains(":")) {
            int lastSeparator = trimmed.lastIndexOf(':');
            return lastSeparator > 0 ? trimmed.substring(0, lastSeparator) + ":***" : "***";
        }
        int lastDot = trimmed.lastIndexOf('.');
        return lastDot > 0 ? trimmed.substring(0, lastDot) + ".***" : "***";
    }

    private static Long secondsBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return null;
        }
        long seconds = Duration.between(start, end).getSeconds();
        return Math.max(0L, seconds);
    }

    private static List<QrLoginStatsResponse.SeriesPoint> mapSeries(RangeBounds range,
                                                                   List<Object[]> dailyRows,
                                                                   List<Object[]> hourlyRows) {
        List<Object[]> rows = "hour".equals(range.bucket()) ? hourlyRows : dailyRows;
        List<QrLoginStatsResponse.SeriesPoint> result = new ArrayList<>();
        if (rows == null) {
            return result;
        }
        for (Object[] row : rows) {
            if (row == null || row.length < 5 || row[0] == null) {
                continue;
            }
            result.add(QrLoginStatsResponse.SeriesPoint.builder()
                    .bucket(String.valueOf(row[0]))
                    .created(longAt(row, 1))
                    .scanned(longAt(row, 2))
                    .approved(longAt(row, 3))
                    .consumed(longAt(row, 4))
                    .build());
        }
        return result;
    }

    private static List<QrLoginStatsResponse.StatusCount> mapStatusCounts(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (QrLoginStatus status : QrLoginStatus.values()) {
            counts.put(status.name(), 0L);
        }
        if (rows != null) {
            for (Object[] row : rows) {
                if (row == null || row.length < 2 || row[0] == null) {
                    continue;
                }
                counts.put(String.valueOf(row[0]), longAt(row, 1));
            }
        }
        List<QrLoginStatsResponse.StatusCount> result = new ArrayList<>();
        counts.forEach((status, count) -> result.add(
                QrLoginStatsResponse.StatusCount.builder().status(status).count(count).build()));
        return result;
    }

    private static List<QrLoginStatsResponse.DeviceCount> mapDevices(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        if (rows != null) {
            for (Object[] row : rows) {
                if (row == null || row.length < 2) {
                    continue;
                }
                String userAgent = row[0] == null ? null : String.valueOf(row[0]);
                String label = QrLoginService.describeDevice(userAgent);
                counts.merge(label, longAt(row, 1), Long::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .map(entry -> QrLoginStatsResponse.DeviceCount.builder()
                        .name(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    private static List<QrLoginStatsResponse.TopUser> mapTopUsers(List<Object[]> rows) {
        List<QrLoginStatsResponse.TopUser> result = new ArrayList<>();
        if (rows == null) {
            return result;
        }
        for (Object[] row : rows) {
            if (row == null || row.length < 4 || row[0] == null) {
                continue;
            }
            result.add(QrLoginStatsResponse.TopUser.builder()
                    .userId(((Number) row[0]).longValue())
                    .fullName(row[1] == null ? null : String.valueOf(row[1]))
                    .email(row[2] == null ? null : String.valueOf(row[2]))
                    .count(longAt(row, 3))
                    .build());
        }
        return result;
    }

    private static long longAt(Object[] row, int index) {
        if (row == null || index >= row.length || row[index] == null) {
            return 0L;
        }
        return ((Number) row[index]).longValue();
    }

    private static double doubleAt(Object[] row, int index) {
        if (row == null || index >= row.length || row[index] == null) {
            return 0D;
        }
        return ((Number) row[index]).doubleValue();
    }

    private static double percent(long numerator, long denominator) {
        return denominator <= 0 ? 0D : round1(numerator * 100D / denominator);
    }

    private static double round1(double value) {
        return Math.round(value * 10D) / 10D;
    }

    private record RangeBounds(LocalDate from, LocalDate to, String bucket,
                               LocalDateTime startUtc, LocalDateTime endUtc) {
    }
}
