package com.saigonvoice.analytics.validation;

import com.saigonvoice.analytics.dto.CreateEventRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CreateEventRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Valid SCAN event with QR trigger passes validation")
    void testValidScanEvent_QR() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("QR")
                .sessionId("sess-123_abc")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Valid SCAN event with GPS and MANUAL triggers pass validation")
    void testValidScanEvent_GPS_and_MANUAL() {
        CreateEventRequest reqGps = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("en")
                .triggerType("GPS")
                .build();
        assertThat(validator.validate(reqGps)).isEmpty();

        CreateEventRequest reqManual = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("ja")
                .triggerType("MANUAL")
                .build();
        assertThat(validator.validate(reqManual)).isEmpty();
    }

    @Test
    @DisplayName("SCAN event without triggerType fails validation")
    void testScanEventMissingTrigger_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType(null)
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("triggerType is required for SCAN"));
    }

    @Test
    @DisplayName("SCAN event with invalid triggerType fails validation")
    void testScanEventInvalidTrigger_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("BEACON")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
    }

    @Test
    @DisplayName("Valid AUDIO_PLAY event passes validation with completed boolean")
    void testValidAudioPlayEvent() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("AUDIO_PLAY")
                .poiId(5L)
                .languageCode("ko")
                .completed(true)
                .sessionId("abc-xyz_123")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Invalid eventType fails validation")
    void testInvalidEventType_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("CLICK")
                .poiId(5L)
                .languageCode("vi")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("eventType must be SCAN or AUDIO_PLAY"));
    }

    @Test
    @DisplayName("Missing poiId fails validation")
    void testMissingPoiId_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .languageCode("vi")
                .triggerType("QR")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("poiId is required"));
    }

    @Test
    @DisplayName("Negative poiId fails validation")
    void testNegativePoiId_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(-1L)
                .languageCode("vi")
                .triggerType("QR")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("poiId must be positive"));
    }

    @Test
    @DisplayName("Invalid languageCode fails validation")
    void testInvalidLanguageCode_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(1L)
                .languageCode("fr")
                .triggerType("QR")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("languageCode must be one of: vi, en, ja, ko"));
    }

    @Test
    @DisplayName("Invalid sessionId characters fail validation")
    void testInvalidSessionId_fails() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("AUDIO_PLAY")
                .poiId(1L)
                .languageCode("vi")
                .sessionId("sess with spaces and @!#")
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("sessionId must contain only alphanumeric"));
    }

    @Test
    @DisplayName("SessionId exceeding 64 chars fails validation")
    void testSessionIdTooLong_fails() {
        String longSessionId = "a".repeat(65);
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("AUDIO_PLAY")
                .poiId(1L)
                .languageCode("vi")
                .sessionId(longSessionId)
                .build();

        Set<ConstraintViolation<CreateEventRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("sessionId max length is 64"));
    }
}
