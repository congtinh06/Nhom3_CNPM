package com.echora.analytics.service;

import com.echora.analytics.client.ContentServiceClient;
import com.echora.analytics.dto.ContentPoiResponse;
import com.echora.analytics.dto.QrAudioStatsResponse;
import com.echora.analytics.exception.BadRequestException;
import com.echora.analytics.repository.AnalyticsEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
@Slf4j
public class QrAudioStatsServiceImpl implements QrAudioStatsService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int DEFAULT_RANGE_DAYS = 7;

    private final AnalyticsEventRepository analyticsEventRepository;
    private final ContentServiceClient contentServiceClient;

    @Value("${analytics.qr-stats.max-range-days:30}")
    private int maxRangeDays = 30;

    @Value("${analytics.poi-cache.ttl-ms:300000}")
    private long cacheTtlMillis = 300000L;

    @Value("${analytics.qr-stats.poi-budget-ms:3000}")
    private long totalBudgetMillis = 3000L;

    private final ConcurrentMap<Long, CachedPoiName> poiNameCache = new ConcurrentHashMap<>();

    public QrAudioStatsServiceImpl(AnalyticsEventRepository analyticsEventRepository,
                                   ContentServiceClient contentServiceClient) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.contentServiceClient = contentServiceClient;
    }

    record CachedPoiName(String name, long expireAtMillis) {
        boolean isExpired(long now) {
            return now > expireAtMillis;
        }
    }

    @Override
    public QrAudioStatsResponse getStats(LocalDate from, LocalDate to, String bucket) {
        RangeBounds range = resolveRange(from, to, bucket);
        List<Object[]> totalRows = analyticsEventRepository.findQrAudioTotals(range.startUtc(), range.endUtc());
        Object[] totalRow = totalRows == null || totalRows.isEmpty() ? null : totalRows.get(0);

        long scans = longAt(totalRow, 0);
        long plays = longAt(totalRow, 1);
        long completed = longAt(totalRow, 2);
        long uniqueSessions = longAt(totalRow, 3);

        return QrAudioStatsResponse.builder()
                .range(QrAudioStatsResponse.Range.builder()
                        .from(range.from().toString())
                        .to(range.to().toString())
                        .bucket(range.bucket())
                        .build())
                .totals(QrAudioStatsResponse.Totals.builder()
                        .scans(scans)
                        .audioPlays(plays)
                        .audioCompleted(completed)
                        .uniqueSessions(uniqueSessions)
                        .build())
                .rates(QrAudioStatsResponse.Rates.builder()
                        .scanToPlayRate(percent(plays, scans))
                        .completionRate(percent(completed, plays))
                        .build())
                .series(mapSeries(qrAudioSeries(range)))
                .triggers(mapKeyCounts(
                        analyticsEventRepository.findQrAudioTriggerCounts(range.startUtc(), range.endUtc()),
                        List.of("QR", "GPS", "MANUAL")))
                .languages(mapKeyCounts(
                        analyticsEventRepository.findQrAudioLanguageCounts(range.startUtc(), range.endUtc()),
                        List.of("vi", "en", "ja", "ko")))
                .devices(mapKeyCounts(
                        analyticsEventRepository.findQrAudioDeviceCounts(range.startUtc(), range.endUtc()),
                        List.of("mobile", "desktop", "tablet", "unknown")))
                .topPois(mapTopPois(
                        analyticsEventRepository.findQrAudioTopPois(range.startUtc(), range.endUtc())))
                .recentScans(mapRecentScans(
                        analyticsEventRepository.findRecentQrAudioScans(range.startUtc(), range.endUtc())))
                .build();
    }

    private List<Object[]> qrAudioSeries(RangeBounds range) {
        if ("hour".equals(range.bucket())) {
            return analyticsEventRepository.findQrAudioHourlySeries(range.startUtc(), range.endUtc());
        }
        return analyticsEventRepository.findQrAudioDailySeries(range.startUtc(), range.endUtc());
    }

    private List<QrAudioStatsResponse.TopPoi> mapTopPois(List<Object[]> rows) {
        List<QrAudioStatsResponse.TopPoi> result = new ArrayList<>();
        if (rows == null || rows.isEmpty()) {
            return result;
        }

        long deadline = System.currentTimeMillis() + Math.max(0L, totalBudgetMillis);
        for (Object[] row : rows) {
            if (row == null || row.length < 4 || row[0] == null) {
                continue;
            }
            long poiId = ((Number) row[0]).longValue();
            long scans = longAt(row, 1);
            long plays = longAt(row, 2);
            long completed = longAt(row, 3);
            String name = resolvePoiName(poiId, deadline);

            result.add(QrAudioStatsResponse.TopPoi.builder()
                    .poiId(poiId)
                    .name(name)
                    .scans(scans)
                    .plays(plays)
                    .completed(completed)
                    .scanToPlayRate(percent(plays, scans))
                    .completionRate(percent(completed, plays))
                    .build());
        }
        return result;
    }

    private List<QrAudioStatsResponse.RecentScan> mapRecentScans(List<Object[]> rows) {
        List<QrAudioStatsResponse.RecentScan> result = new ArrayList<>();
        if (rows == null || rows.isEmpty()) {
            return result;
        }

        long deadline = System.currentTimeMillis() + Math.max(0L, totalBudgetMillis);
        for (Object[] row : rows) {
            if (row == null || row.length < 6 || row[0] == null) {
                continue;
            }
            Long poiId = row[1] == null ? null : ((Number) row[1]).longValue();
            result.add(QrAudioStatsResponse.RecentScan.builder()
                    .occurredAt(String.valueOf(row[0]))
                    .poiId(poiId)
                    .poiName(poiId == null ? null : resolvePoiName(poiId, deadline))
                    .languageCode(row[2] == null ? null : String.valueOf(row[2]))
                    .triggerType(row[3] == null ? null : String.valueOf(row[3]))
                    .deviceType(row[4] == null ? null : String.valueOf(row[4]))
                    .sessionId(row[5] == null ? null : String.valueOf(row[5]))
                    .build());
        }
        return result;
    }

    private String resolvePoiName(Long poiId, long deadline) {
        long now = System.currentTimeMillis();
        CachedPoiName cached = poiNameCache.get(poiId);
        if (cached != null && !cached.isExpired(now)) {
            return cached.name();
        }

        long remainingBudget = deadline - now;
        if (remainingBudget <= 0) {
            log.warn("QR audio stats POI name budget exceeded for poiId={}", poiId);
            return null;
        }

        String name = fetchPoiNameWithBudget(poiId, remainingBudget);
        poiNameCache.put(poiId, new CachedPoiName(name, System.currentTimeMillis() + cacheTtlMillis));
        return name;
    }

    private String fetchPoiNameWithBudget(Long poiId, long remainingBudgetMs) {
        long callTimeout = Math.min(remainingBudgetMs, 2000L);
        try {
            ContentPoiResponse response = CompletableFuture.supplyAsync(
                    () -> contentServiceClient.getPoiById(poiId, "vi")
            ).get(callTimeout, TimeUnit.MILLISECONDS);
            return response == null ? null : response.getName();
        } catch (TimeoutException ex) {
            log.warn("Content-service timed out resolving poiId={} for QR audio stats", poiId);
            return null;
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause() == null ? ex : ex.getCause();
            log.warn("Content-service failed resolving poiId={} for QR audio stats: {}", poiId, cause.getMessage());
            return null;
        } catch (Exception ex) {
            log.warn("Content-service failed resolving poiId={} for QR audio stats: {}", poiId, ex.getMessage());
            return null;
        }
    }

    private static List<QrAudioStatsResponse.SeriesPoint> mapSeries(List<Object[]> rows) {
        List<QrAudioStatsResponse.SeriesPoint> result = new ArrayList<>();
        if (rows == null) {
            return result;
        }
        for (Object[] row : rows) {
            if (row == null || row.length < 4 || row[0] == null) {
                continue;
            }
            result.add(QrAudioStatsResponse.SeriesPoint.builder()
                    .bucket(String.valueOf(row[0]))
                    .scans(longAt(row, 1))
                    .plays(longAt(row, 2))
                    .completed(longAt(row, 3))
                    .build());
        }
        return result;
    }

    private static List<QrAudioStatsResponse.KeyCount> mapKeyCounts(List<Object[]> rows, List<String> keys) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String key : keys) {
            counts.put(key, 0L);
        }
        if (rows != null) {
            for (Object[] row : rows) {
                if (row == null || row.length < 2 || row[0] == null) {
                    continue;
                }
                counts.put(String.valueOf(row[0]), longAt(row, 1));
            }
        }

        List<QrAudioStatsResponse.KeyCount> result = new ArrayList<>();
        counts.forEach((key, count) -> result.add(
                QrAudioStatsResponse.KeyCount.builder().key(key).count(count).build()));
        return result;
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

    private static long longAt(Object[] row, int index) {
        if (row == null || index >= row.length || row[index] == null) {
            return 0L;
        }
        return ((Number) row[index]).longValue();
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
