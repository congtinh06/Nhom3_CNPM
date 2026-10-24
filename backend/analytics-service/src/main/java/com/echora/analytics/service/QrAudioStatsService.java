package com.echora.analytics.service;

import com.echora.analytics.dto.QrAudioStatsResponse;

import java.time.LocalDate;

public interface QrAudioStatsService {
    QrAudioStatsResponse getStats(LocalDate from, LocalDate to, String bucket);
}
