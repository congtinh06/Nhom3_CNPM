package com.saigonvoice.auth.dto;

import com.saigonvoice.auth.entity.QrLoginStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Thong tin hien thi tren thiet bi B sau khi quet ma. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrScanResponse {

    private UUID sessionId;
    private QrLoginStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String deviceLabel;
}
