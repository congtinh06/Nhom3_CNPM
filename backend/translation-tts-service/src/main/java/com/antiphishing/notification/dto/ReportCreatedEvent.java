package com.antiphishing.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreatedEvent implements Serializable {
    private Long reportId;
    private String targetUrl;
    private String channel;
    private String reporterContact;
    private Boolean isPhishing;
    private Double riskScore;
    private List<String> reasonCodes;
    private String locale;
    private Instant createdAt;
}
