package com.saigonvoice.auth.service;

import com.saigonvoice.auth.dto.QrLoginSessionResponse;
import com.saigonvoice.auth.dto.QrLoginStatsResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface QrLoginStatsService {

    QrLoginStatsResponse getStats(LocalDate from, LocalDate to, String bucket);

    Page<QrLoginSessionResponse> getSessions(LocalDate from, LocalDate to,
                                             String status, int page, int size);
}
