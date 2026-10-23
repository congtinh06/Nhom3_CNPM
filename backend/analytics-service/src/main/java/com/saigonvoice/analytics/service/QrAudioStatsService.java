package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.dto.QrAudioStatsResponse;

import java.time.LocalDate;

public interface QrAudioStatsService {
    QrAudioStatsResponse getStats(LocalDate from, LocalDate to, String bucket);
}
