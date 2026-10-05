package com.saigonvoice.analytics.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEventRequest {

    @NotBlank(message = "eventType is required")
    @Pattern(regexp = "^(SCAN|AUDIO_PLAY)$", message = "eventType must be SCAN or AUDIO_PLAY")
    private String eventType;

    @NotNull(message = "poiId is required")
    @Positive(message = "poiId must be positive")
    private Long poiId;

    @NotBlank(message = "languageCode is required")
    @Pattern(regexp = "^(vi|en|ja|ko)$", message = "languageCode must be one of: vi, en, ja, ko")
    private String languageCode;

    private String triggerType;

    private Boolean completed;

    @Size(max = 64, message = "sessionId max length is 64")
    @Pattern(regexp = "^[A-Za-z0-9-_]*$", message = "sessionId must contain only alphanumeric, hyphen, or underscore characters")
    private String sessionId;

    @JsonIgnore
    @AssertTrue(message = "triggerType is required for SCAN and must be QR, GPS, or MANUAL")
    public boolean isTriggerTypeValidForScan() {
        if ("SCAN".equals(eventType)) {
            return triggerType != null && !triggerType.isBlank() && triggerType.matches("^(QR|GPS|MANUAL)$");
        }
        return true;
    }

    @JsonIgnore
    @AssertTrue(message = "triggerType must be one of: QR, GPS, MANUAL")
    public boolean isTriggerTypeValid() {
        if (triggerType != null && !triggerType.isBlank()) {
            return triggerType.matches("^(QR|GPS|MANUAL)$");
        }
        return true;
    }
}
