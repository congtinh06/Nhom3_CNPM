package com.echora.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrLoginSessionResponse {

    private UUID id;
    private String status;
    private UserRef user;
    private String deviceLabel;
    private String createdIp;
    private String approvedIp;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime scannedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime consumedAt;
    private Long scanSeconds;
    private Long totalSeconds;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserRef {
        private Long id;
        private String fullName;
        private String email;
    }
}
