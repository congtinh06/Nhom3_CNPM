package com.echora.analytics.dto;

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
    @Pattern(regexp = "^(SCAN|AUDIO_PLAY|VISIT)$", message = "eventType must be SCAN, AUDIO_PLAY, or VISIT")
    private String eventType;

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
    @AssertTrue(message = "poiId is required for SCAN and AUDIO_PLAY")
    public boolean isPoiIdValidForType() {
        if ("VISIT".equals(eventType)) {
            return true;
        }
        return poiId != null;
    }

    @JsonIgnore
    @AssertTrue(message = "triggerType is required for SCAN and must be QR, GPS, or MANUAL")
    public boolean isTriggerTypeValidForScan() {
        if ("SCAN".equals(eventType)) {
            return triggerType != null && !triggerType.isBlank() && triggerType.matches("^(QR|GPS|MANUAL)$");
        }
        return true;
    }

    @JsonIgnore
    @AssertTrue(message = "triggerType for VISIT must be QR or DIRECT")
    public boolean isTriggerTypeValidForVisit() {
        if ("VISIT".equals(eventType) && triggerType != null && !triggerType.isBlank()) {
            return triggerType.matches("^(QR|DIRECT)$");
        }
        return true;
    }

    @JsonIgnore
    @AssertTrue(message = "triggerType must be one of: QR, GPS, MANUAL, DIRECT")
    public boolean isTriggerTypeValid() {
        if (triggerType != null && !triggerType.isBlank()) {
            return triggerType.matches("^(QR|GPS|MANUAL|DIRECT)$");
        }
        return true;
    }
}
