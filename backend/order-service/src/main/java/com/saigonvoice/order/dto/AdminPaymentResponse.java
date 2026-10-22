package com.saigonvoice.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentResponse {
    private Long id;
    private String provider;
    private String txnRef;
    private BigDecimal amount;
    private String status;
    private String responseCode;
    private String transactionNo;
    private String bankCode;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
