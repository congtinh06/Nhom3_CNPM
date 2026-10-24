package com.echora.auth.service;

import com.echora.auth.dto.QrLoginSessionResponse;
import com.echora.auth.dto.QrLoginStatsResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface QrLoginStatsService {

    QrLoginStatsResponse getStats(LocalDate from, LocalDate to, String bucket);

    Page<QrLoginSessionResponse> getSessions(LocalDate from, LocalDate to,
                                             String status, int page, int size);
}
