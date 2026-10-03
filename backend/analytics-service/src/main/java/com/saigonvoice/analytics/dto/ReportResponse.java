package com.saigonvoice.analytics.dto;

import com.saigonvoice.analytics.entity.ReportChannel;
import com.saigonvoice.analytics.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    private String targetUrl;
    private ReportChannel channel;
    private String reporterContact;
    private String description;
    private Boolean isPhishing;
    private Double riskScore;
    private ReportStatus status;
    private Instant createdAt;
}
