package com.antiphishing.report.messaging;

import com.antiphishing.report.entity.ReportChannel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreatedEvent implements Serializable {
    private Long reportId;
    private String targetUrl;
    private ReportChannel channel;
    private String reporterContact;
    private Boolean isPhishing;
    private Double riskScore;
    private Instant createdAt;
}
