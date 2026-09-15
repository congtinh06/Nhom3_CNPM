package com.antiphishing.linkverification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyResponse {
    private String url;
    private String domain;
    private boolean isPhishing;
    private Double riskScore;
    private List<String> sources;
    private Instant checkedAt;
}
