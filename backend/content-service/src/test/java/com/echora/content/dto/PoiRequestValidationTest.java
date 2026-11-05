package com.echora.content.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Bean Validation cho payload admin tạo/cập nhật POI. Các biên địa lý riêng của TP.HCM
 * được kiểm tra ở PoiContentServiceImplTest vì phụ thuộc cấu hình runtime.
 */
class PoiRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private CreatePoiRequest.CreatePoiRequestBuilder validCreate() {
        return CreatePoiRequest.builder()
                .zoneId(1L)
                .categoryId(1L)
                .code("POI_NEW_01")
                .qrToken("qr-new-01")
                .name("Điểm mới")
                .latitude(new BigDecimal("10.7750000"))
                .longitude(new BigDecimal("106.7050000"))
                .triggerRadiusMeters(50)
                .title("Tiêu đề")
                .summary("Tóm tắt")
                .description("Mô tả");
    }

    @Test
    @DisplayName("valid create request has no violations")
    void validCreateRequest() {
        assertThat(validator.validate(validCreate().build())).isEmpty();
    }

    @Test
    @DisplayName("latitude/longitude outside -90..90 and -180..180 are rejected")
    void rejectsWorldBoundsViolations() {
        Set<ConstraintViolation<CreatePoiRequest>> violations = validator.validate(
                validCreate().latitude(new BigDecimal("91")).longitude(new BigDecimal("181")).build());

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .contains("latitude", "longitude");
    }

    @Test
    @DisplayName("radius must be within 1..5000 metres")
    void rejectsRadiusOutsideRange() {
        assertThat(validator.validate(validCreate().triggerRadiusMeters(0).build()))
                .extracting(v -> v.getPropertyPath().toString()).contains("triggerRadiusMeters");
        assertThat(validator.validate(validCreate().triggerRadiusMeters(5001).build()))
                .extracting(v -> v.getPropertyPath().toString()).contains("triggerRadiusMeters");
        assertThat(validator.validate(validCreate().triggerRadiusMeters(1).build())).isEmpty();
        assertThat(validator.validate(validCreate().triggerRadiusMeters(5000).build())).isEmpty();
    }

    @Test
    @DisplayName("blank code/name and unsafe code characters are rejected")
    void rejectsBlankAndUnsafeIdentifiers() {
        assertThat(validator.validate(validCreate().code(" ").name(" ").build()))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("code", "name");
        assertThat(validator.validate(validCreate().code("POI NEW/01").build()))
                .extracting(v -> v.getPropertyPath().toString()).contains("code");
    }

    @Test
    @DisplayName("supportedLanguages only accepts vi/en/ja/ko")
    void rejectsUnsupportedLanguage() {
        assertThat(validator.validate(validCreate().supportedLanguages(List.of("vi", "fr")).build()))
                .extracting(v -> v.getPropertyPath().toString())
                .anyMatch(path -> path.startsWith("supportedLanguages"));
        assertThat(validator.validate(validCreate().supportedLanguages(List.of("vi", "en", "ja", "ko")).build()))
                .isEmpty();
    }

    @Test
    @DisplayName("update request keeps the same radius and language rules")
    void updateRequestRules() {
        UpdatePoiRequest request = UpdatePoiRequest.builder()
                .version(1L)
                .categoryId(1L)
                .name("Điểm mới")
                .latitude(new BigDecimal("10.7750000"))
                .longitude(new BigDecimal("106.7050000"))
                .triggerRadiusMeters(9999)
                .supportedLanguages(List.of("de"))
                .title("Tiêu đề")
                .summary("Tóm tắt")
                .description("Mô tả")
                .build();

        assertThat(validator.validate(request))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("triggerRadiusMeters")
                .anyMatch(path -> path.startsWith("supportedLanguages"));
    }
}
