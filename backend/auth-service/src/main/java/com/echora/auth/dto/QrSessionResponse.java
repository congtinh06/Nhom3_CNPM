package com.echora.auth.dto;

import com.echora.auth.entity.QrLoginStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Thong tin thiet bi A can de hien thi ma QR va poll trang thai. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrSessionResponse {

    private UUID sessionId;
    private String qrToken;
    private String exchangeToken;
    private QrLoginStatus status;
    private LocalDateTime expiresAt;
    private long expiresInSeconds;
    private long pollIntervalMs;
}
