package com.saigonvoice.auth.dto;

import com.saigonvoice.auth.entity.QrLoginStatus;
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
public class QrStatusResponse {

    private UUID sessionId;
    private QrLoginStatus status;
    private LocalDateTime expiresAt;
    private long expiresInSeconds;
    private String message;
}
