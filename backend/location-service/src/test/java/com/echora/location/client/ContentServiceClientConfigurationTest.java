package com.echora.location.client;

import feign.Request;
import feign.Retryer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "feign.content-service.connect-timeout-ms=5000",
        "feign.content-service.read-timeout-ms=10000",
        "internal.api-key=test-key-123"
})
class ContentServiceClientConfigurationTest {

    @Autowired
    private ContentServiceClientConfiguration config;

    @Test
    @DisplayName("D2-Fix Q2: requestOptions() returns timeout configuration")
    void testRequestOptions_HasTimeoutConfiguration() {
        Request.Options options = config.requestOptions();

        assertNotNull(options);
        assertEquals(5000, options.connectTimeoutMillis());
        assertEquals(10000, options.readTimeoutMillis());
        assertTrue(options.isFollowRedirects());
    }

    @Test
    @DisplayName("D2-Fix Q2: requestOptions() respects application.yml timeout values")
    void testRequestOptions_RespectsConfiguredTimeouts() {
        Request.Options options = config.requestOptions();

        // Values from @TestPropertySource above
        assertEquals(5000, options.connectTimeoutMillis(), "Connect timeout should be 5000ms from config");
        assertEquals(10000, options.readTimeoutMillis(), "Read timeout should be 10000ms from config");
    }

    @Test
    @DisplayName("D2-Fix Q2: retryer() returns NEVER_RETRY (no automatic retry on failure)")
    void testRetryer_NeverRetries() {
        Retryer retryer = config.retryer();

        assertSame(Retryer.NEVER_RETRY, retryer, "Retryer should be NEVER_RETRY");
    }
}
