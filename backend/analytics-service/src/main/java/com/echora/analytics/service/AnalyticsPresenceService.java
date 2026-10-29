package com.echora.analytics.service;

import com.echora.analytics.dto.PresenceRequest;
import com.echora.analytics.repository.AnalyticsPresenceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@Slf4j
public class AnalyticsPresenceService {

    private final AnalyticsPresenceRepository presenceRepository;
    private final Clock clock;

    @Autowired
    public AnalyticsPresenceService(AnalyticsPresenceRepository presenceRepository,
                                    @Autowired(required = false) Clock clock) {
        this.presenceRepository = presenceRepository;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    /**
     * Ghi nhận phiên còn hoạt động. Lỗi ghi presence không được làm hỏng trải
     * nghiệm người dùng, nên chỉ log lại.
     */
    public void touch(PresenceRequest request) {
        if (request == null || request.getSessionId() == null || request.getSessionId().isBlank()) {
            return;
        }
        try {
            presenceRepository.upsertPresence(
                    request.getSessionId().trim(),
                    LocalDateTime.now(clock),
                    normalizeLanguage(request.getLanguageCode()),
                    normalizeDevice(request.getDeviceType()));
        } catch (Exception ex) {
            log.warn("Failed to record presence for sessionId={}: {}", request.getSessionId(), ex.getMessage());
        }
    }

    private static String normalizeLanguage(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return switch (trimmed) {
            case "vi", "en", "ja", "ko" -> trimmed;
            default -> null;
        };
    }

    private static String normalizeDevice(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() > 20 ? trimmed.substring(0, 20) : trimmed;
    }
}
