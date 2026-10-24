package com.echora.location.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class LocationStartupCheckTest {

    @Test
    @DisplayName("Startup check logs warning when key is empty without failing startup")
    void testStartupCheck_EmptyKey() {
        LocationStartupCheck check = new LocationStartupCheck();
        ReflectionTestUtils.setField(check, "internalApiKey", "");
        assertDoesNotThrow(check::validateConfiguration);
    }

    @Test
    @DisplayName("Startup check passes cleanly when key is provided")
    void testStartupCheck_KeyProvided() {
        LocationStartupCheck check = new LocationStartupCheck();
        ReflectionTestUtils.setField(check, "internalApiKey", "valid-secret-key");
        assertDoesNotThrow(check::validateConfiguration);
    }
}
