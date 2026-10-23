package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.client.ContentServiceClient;
import com.saigonvoice.analytics.dto.AnalyticsSummaryResponse;
import com.saigonvoice.analytics.dto.ContentPoiResponse;
import com.saigonvoice.analytics.repository.AnalyticsEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Service
@Slf4j
public class AnalyticsSummaryServiceImpl implements AnalyticsSummaryService {

    private AnalyticsEventRepository analyticsEventRepository;
    private ContentServiceClient contentServiceClient;
    private long cacheTtlMillis = 300000L;
    private long totalBudgetMillis = 3000L;

    private final ConcurrentMap<Long, CachedPoiName> poiNameCache = new ConcurrentHashMap<>();

    record CachedPoiName(String name, long expireAtMillis) {
        boolean isExpired(long now) {
            return now > expireAtMillis;
        }
    }

    AnalyticsSummaryServiceImpl() {
    }

    @Autowired
    public AnalyticsSummaryServiceImpl(
            AnalyticsEventRepository analyticsEventRepository,
            ContentServiceClient contentServiceClient,
            @Value("${analytics.poi-cache.ttl-ms:300000}") long cacheTtlMillis,
            @Value("${analytics.summary.poi-budget-ms:3000}") long totalBudgetMillis) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.contentServiceClient = contentServiceClient;
        this.cacheTtlMillis = cacheTtlMillis;
        this.totalBudgetMillis = totalBudgetMillis;
    }

    public AnalyticsSummaryServiceImpl(
            AnalyticsEventRepository analyticsEventRepository,
            ContentServiceClient contentServiceClient) {
        this(analyticsEventRepository, contentServiceClient, 300000L, 3000L);
    }

    @Override
    public AnalyticsSummaryResponse getSummary() {
        long totalScans = analyticsEventRepository.countByEventType("SCAN");

        Map<String, Long> scansByTrigger = new LinkedHashMap<>();
        scansByTrigger.put("QR", 0L);
        scansByTrigger.put("GPS", 0L);
        scansByTrigger.put("MANUAL", 0L);

        List<Object[]> scanCounts = analyticsEventRepository.countScansByTriggerType();
        if (scanCounts != null) {
            for (Object[] row : scanCounts) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    String trigger = row[0].toString();
                    long count = ((Number) row[1]).longValue();
                    if (scansByTrigger.containsKey(trigger)) {
                        scansByTrigger.put(trigger, count);
                    }
                }
            }
        }

        long totalAudioPlays = analyticsEventRepository.countStartedByEventType("AUDIO_PLAY");
        long audioCompleted = analyticsEventRepository.countByEventTypeAndCompletedTrue("AUDIO_PLAY");

        Map<String, Long> playsByLanguage = new LinkedHashMap<>();
        playsByLanguage.put("vi", 0L);
        playsByLanguage.put("en", 0L);
        playsByLanguage.put("ja", 0L);
        playsByLanguage.put("ko", 0L);

        List<Object[]> playCounts = analyticsEventRepository.countAudioPlaysByLanguage();
        if (playCounts != null) {
            for (Object[] row : playCounts) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    String lang = row[0].toString();
                    long count = ((Number) row[1]).longValue();
                    if (playsByLanguage.containsKey(lang)) {
                        playsByLanguage.put(lang, count);
                    }
                }
            }
        }

        List<Object[]> topPoiRows = analyticsEventRepository.findTopPoisRaw(PageRequest.of(0, 5));
        List<AnalyticsSummaryResponse.TopPoiDto> topPois = new ArrayList<>();

        if (topPoiRows != null) {
            long deadline = System.currentTimeMillis() + totalBudgetMillis;
            for (Object[] row : topPoiRows) {
                if (row != null && row.length >= 3 && row[0] != null) {
                    Long poiId = ((Number) row[0]).longValue();
                    long scans = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    long plays = row[2] != null ? ((Number) row[2]).longValue() : 0L;

                    String poiName = null;
                    long now = System.currentTimeMillis();
                    CachedPoiName cached = poiNameCache.get(poiId);
                    if (cached != null && !cached.isExpired(now)) {
                        poiName = cached.name();
                    } else {
                        long remainingBudget = deadline - System.currentTimeMillis();
                        if (remainingBudget <= 0) {
                            log.warn("Summary POI name resolution budget exceeded for poiId={}, leaving name null", poiId);
                            poiName = null;
                        } else {
                            poiName = fetchPoiNameWithBudget(poiId, remainingBudget);
                            poiNameCache.put(poiId, new CachedPoiName(poiName, System.currentTimeMillis() + cacheTtlMillis));
                        }
                    }

                    topPois.add(AnalyticsSummaryResponse.TopPoiDto.builder()
                            .poiId(poiId)
                            .name(poiName)
                            .scans(scans)
                            .plays(plays)
                            .build());
                }
            }
        }

        return AnalyticsSummaryResponse.builder()
                .totalScans(totalScans)
                .scansByTrigger(scansByTrigger)
                .totalAudioPlays(totalAudioPlays)
                .audioCompleted(audioCompleted)
                .playsByLanguage(playsByLanguage)
                .topPois(topPois)
                .build();
    }

    private String fetchPoiNameWithBudget(Long poiId, long remainingBudgetMs) {
        long callTimeout = Math.min(remainingBudgetMs, 2000L);
        try {
            ContentPoiResponse poiResponse = CompletableFuture.supplyAsync(
                    () -> contentServiceClient.getPoiById(poiId, "vi")
            ).get(callTimeout, TimeUnit.MILLISECONDS);
            return poiResponse != null ? poiResponse.getName() : null;
        } catch (TimeoutException ex) {
            log.warn("Feign call to content-service timed out within budget for poiId={}. Falling back to null name.", poiId);
            return null;
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            log.warn("Feign call to content-service failed for poiId={}: {}. Falling back to null name.",
                    poiId, cause.getMessage());
            return null;
        } catch (Exception ex) {
            log.warn("Feign call to content-service failed for poiId={}: {}. Falling back to null name.",
                    poiId, ex.getMessage());
            return null;
        }
    }

    public void clearCache() {
        poiNameCache.clear();
    }

    public int getCacheSize() {
        return poiNameCache.size();
    }
}
