package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.client.ContentServiceClient;
import com.saigonvoice.analytics.dto.AnalyticsSummaryResponse;
import com.saigonvoice.analytics.dto.ContentPoiResponse;
import com.saigonvoice.analytics.repository.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsSummaryServiceImpl implements AnalyticsSummaryService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final ContentServiceClient contentServiceClient;

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

        long totalAudioPlays = analyticsEventRepository.countByEventType("AUDIO_PLAY");
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
            for (Object[] row : topPoiRows) {
                if (row != null && row.length >= 3 && row[0] != null) {
                    Long poiId = ((Number) row[0]).longValue();
                    long scans = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    long plays = row[2] != null ? ((Number) row[2]).longValue() : 0L;

                    String poiName = null;
                    try {
                        ContentPoiResponse poiResponse = contentServiceClient.getPoiById(poiId, "vi");
                        if (poiResponse != null) {
                            poiName = poiResponse.getName();
                        }
                    } catch (Exception ex) {
                        log.warn("Feign call to content-service failed for poiId={}: {}. Falling back to null name.",
                                poiId, ex.getMessage());
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
}
