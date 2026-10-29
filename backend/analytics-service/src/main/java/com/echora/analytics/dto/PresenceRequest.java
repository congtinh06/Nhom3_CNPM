package com.echora.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Heartbeat hiện diện do trình duyệt gửi định kỳ (khoảng 1 phút/lần).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresenceRequest {

    @NotBlank(message = "sessionId is required")
    @Size(max = 64, message = "sessionId max length is 64")
    private String sessionId;

    @Pattern(regexp = "^(vi|en|ja|ko)$", message = "languageCode must be one of: vi, en, ja, ko")
    private String languageCode;

    @Size(max = 20, message = "deviceType max length is 20")
    private String deviceType;
}
