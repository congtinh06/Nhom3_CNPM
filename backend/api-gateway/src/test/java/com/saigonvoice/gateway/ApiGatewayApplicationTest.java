package com.saigonvoice.gateway;

import com.saigonvoice.gateway.filter.AdminAuthGlobalFilter;
import com.saigonvoice.gateway.filter.AnalyticsRateLimitGlobalFilter;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class ApiGatewayApplicationTest {

    @LocalServerPort
    private int port;

    private static HttpServer mockDownstreamServer;
    private static int mockPort;
    private static final String TEST_ADMIN_KEY = "test-secret-admin-key-2026";
    private static final AtomicBoolean downstreamReceivedInternalKey = new AtomicBoolean(false);
    private static final AtomicBoolean downstreamReceivedAdminKey = new AtomicBoolean(false);
    private static final AtomicInteger downstreamRequestCount = new AtomicInteger(0);

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private AdminAuthGlobalFilter adminAuthFilter;

    @Autowired
    private AnalyticsRateLimitGlobalFilter rateLimitFilter;

    @BeforeAll
    static void startMockServer() {
        ensureMockServerStarted();
    }

    private static synchronized void ensureMockServerStarted() {
        if (mockDownstreamServer != null) {
            return;
        }

        try {
        mockDownstreamServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        mockDownstreamServer.createContext("/", exchange -> {
            downstreamRequestCount.incrementAndGet();
            String path = exchange.getRequestURI().getPath();

            // Detect if client-supplied X-Internal-Api-Key reached downstream
            if (exchange.getRequestHeaders().containsKey("X-Internal-Api-Key") ||
                    exchange.getRequestHeaders().containsKey("x-internal-api-key")) {
                downstreamReceivedInternalKey.set(true);
            }

            // Detect if X-Admin-Key was forwarded downstream (it should NOT be)
            if (exchange.getRequestHeaders().containsKey("X-Admin-Key") ||
                    exchange.getRequestHeaders().containsKey("x-admin-key")) {
                downstreamReceivedAdminKey.set(true);
            }

            byte[] responseBytes = ("{\"status\":\"ok\",\"path\":\"" + path + "\"}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        mockDownstreamServer.start();
        mockPort = mockDownstreamServer.getAddress().getPort();
        } catch (IOException exception) {
            throw new UncheckedIOException("Unable to start mock downstream server", exception);
        }
    }

    @AfterAll
    static void stopMockServer() {
        if (mockDownstreamServer != null) {
            mockDownstreamServer.stop(0);
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        ensureMockServerStarted();
        registry.add("CONTENT_SERVICE_URL", () -> "http://127.0.0.1:" + mockPort);
        registry.add("LOCATION_SERVICE_URL", () -> "http://127.0.0.1:" + mockPort);
        registry.add("TRANSLATION_TTS_SERVICE_URL", () -> "http://127.0.0.1:" + mockPort);
        registry.add("ANALYTICS_SERVICE_URL", () -> "http://127.0.0.1:" + mockPort);
        registry.add("ADMIN_API_KEY", () -> TEST_ADMIN_KEY);
    }

    @BeforeEach
    void resetState() {
        downstreamReceivedInternalKey.set(false);
        downstreamReceivedAdminKey.set(false);
        downstreamRequestCount.set(0);
        adminAuthFilter.setAdminApiKey(TEST_ADMIN_KEY);
        rateLimitFilter.clearRateLimitCache();
    }

    @Test
    void contextLoads() {
        // Preserved original smoke test
    }

    // ==========================================
    // Step 1.7c Hardened Path Matching & Blocking Tests
    // Assert mock downstream receives NOTHING (count unchanged) for blocked cases
    // ==========================================

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("blockedCases")
    void blockedRequestsDoNotReachDownstream(String caseName, HttpMethod method, String path,
                                             int expectedStatus, String adminKey) {
        URI uri = URI.create("http://localhost:" + port + path);
        int before = downstreamRequestCount.get();
        webTestClient.method(method).uri(uri)
                .headers(headers -> {
                    if (adminKey != null) {
                        headers.set("X-Admin-Key", adminKey);
                    }
                })
                .exchange()
                .expectStatus().isEqualTo(expectedStatus);
        assertThat(downstreamRequestCount.get())
                .as("Downstream must receive NOTHING for blocked case: " + caseName)
                .isEqualTo(before);
    }

    private static Stream<Arguments> blockedCases() {
        return Stream.of(
                Arguments.of("uppercase-admin-segment", HttpMethod.GET, "/api/content/ADMIN/pois", 404, null),
                Arguments.of("double-slash", HttpMethod.GET, "//api/content/admin/pois", 400, null),
                Arguments.of("current-directory-segment", HttpMethod.GET, "/api/content/./admin/pois", 400, null),
                Arguments.of("parent-directory-segment-public", HttpMethod.GET, "/api/content/pois/../admin/pois", 400, null),
                Arguments.of("parent-directory-segment-admin", HttpMethod.GET, "/api/content/admin/../admin/pois", 400, null),
                Arguments.of("percent-encoded-admin", HttpMethod.GET, "/api/content/%61dmin/pois", 400, null),
                Arguments.of("percent-encoded-traversal", HttpMethod.GET, "/api/content/pois%2f..%2fadmin", 400, null),
                Arguments.of("matrix-parameter", HttpMethod.GET, "/api/content/pois;x=1", 400, null),
                Arguments.of("semicolon-suffix", HttpMethod.GET, "/api/content/foo;", 400, null),
                Arguments.of("admin-no-key", HttpMethod.GET, "/api/content/admin/pois", 401, null),
                Arguments.of("admin-wrong-key", HttpMethod.GET, "/api/content/admin/pois", 401, "wrong-key"),
                Arguments.of("admin-trailing-slash-no-key", HttpMethod.GET, "/api/content/admin/pois/", 401, null),
                Arguments.of("admin-trailing-slash-wrong-key", HttpMethod.GET, "/api/content/admin/pois/", 401, "wrong-key"),
                Arguments.of("uppercase-internal-segment", HttpMethod.GET, "/api/content/INTERNAL/pois/qr/x", 404, null),
                Arguments.of("internal-path", HttpMethod.GET, "/api/content/internal/pois/qr/x", 404, null),
                Arguments.of("public-path-wrong-method", HttpMethod.POST, "/api/content/pois", 404, null),
                Arguments.of("unknown-content-path", HttpMethod.GET, "/api/content/foo", 404, null)
        );
    }

    // ==========================================
    // Positive Cases
    // ==========================================

    @Test
    void testPositiveCases() {
        // GET /api/content/pois/1?lang=vi -> 200 OK
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois/1?lang=vi")
                .exchange()
                .expectStatus().isOk();

        // GET /api/content/pois/qr/abc -> 200 OK
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois/qr/abc")
                .exchange()
                .expectStatus().isOk();

        // Admin with correct key (GET and PUT)
        // 1. GET /api/content/admin/pois/publish-status
        webTestClient.get().uri("http://localhost:" + port + "/api/content/admin/pois/publish-status")
                .header("X-Admin-Key", TEST_ADMIN_KEY)
                .exchange()
                .expectStatus().isOk();

        // 2. PUT /api/content/admin/pois/1
        webTestClient.put().uri("http://localhost:" + port + "/api/content/admin/pois/1")
                .header("X-Admin-Key", TEST_ADMIN_KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"title\":\"updated\"}")
                .exchange()
                .expectStatus().isOk();

        // Crucial security rule: X-Admin-Key must NOT be forwarded downstream!
        assertThat(downstreamReceivedAdminKey.get())
                .as("X-Admin-Key must NOT be forwarded downstream to backend microservices")
                .isFalse();
    }

    @Test
    void testPublicPathsRouting() {
        // Content service public paths
        webTestClient.get().uri("/api/content/categories")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/pois")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/pois/10")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/pois/qr/sample-token")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/routes")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/routes/5")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/zones")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/content/zones/2")
                .exchange()
                .expectStatus().isOk();

        // Location service public paths
        webTestClient.get().uri("/api/location/nearby?lat=10.77&lng=106.69&radius=500")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/location/resolve?lat=10.77&lng=106.69")
                .exchange()
                .expectStatus().isOk();

        webTestClient.get().uri("/api/location/qr/test-token")
                .exchange()
                .expectStatus().isOk();

        // TTS audio public path
        webTestClient.get().uri("/api/tts/audio/poi_1_vi_12345678.mp3")
                .exchange()
                .expectStatus().isOk();

        // Analytics events public path
        webTestClient.post().uri("/api/analytics/events")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"eventType\":\"SCAN\",\"poiId\":1,\"languageCode\":\"vi\",\"triggerType\":\"QR\"}")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void testAdminAuthOnAnalyticsSummary() {
        // Missing key on GET /api/analytics/summary -> 401
        webTestClient.get().uri("/api/analytics/summary")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.status").isEqualTo(401)
                .jsonPath("$.error").isEqualTo("Unauthorized")
                .jsonPath("$.message").isEqualTo("Unauthorized");

        // Wrong key on GET /api/analytics/summary -> 401
        webTestClient.get().uri("/api/analytics/summary")
                .header("X-Admin-Key", "invalid-key")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.status").isEqualTo(401)
                .jsonPath("$.message").isEqualTo("Unauthorized");

        // Right key on GET /api/analytics/summary -> 200 OK
        webTestClient.get().uri("/api/analytics/summary")
                .header("X-Admin-Key", TEST_ADMIN_KEY)
                .exchange()
                .expectStatus().isOk();

        assertThat(downstreamReceivedAdminKey.get())
                .as("X-Admin-Key must NOT be forwarded downstream to analytics-service")
                .isFalse();
    }

    @Test
    void testFailClosedWhenAdminKeyIsUnset() {
        adminAuthFilter.setAdminApiKey("");

        // Even with a key provided in the header, access MUST be denied with 401 (generic body, no hints)
        webTestClient.post().uri("http://localhost:" + port + "/api/content/admin/pois")
                .header("X-Admin-Key", "any-random-key")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.status").isEqualTo(401)
                .jsonPath("$.message").isEqualTo("Unauthorized");

        webTestClient.get().uri("/api/analytics/summary")
                .header("X-Admin-Key", "any-random-key")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.status").isEqualTo(401)
                .jsonPath("$.message").isEqualTo("Unauthorized");
    }

    @Test
    void testOptionsPreflightDoesNotRequireAdminKey() {
        // Preflight to /api/content/admin/pois
        webTestClient.options().uri("http://localhost:" + port + "/api/content/admin/pois")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "X-Admin-Key, Content-Type")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:5173");

        // Preflight to /api/analytics/summary
        webTestClient.options().uri("http://localhost:" + port + "/api/analytics/summary")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Admin-Key")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:5173");
    }

    @Test
    void testClientSuppliedInternalApiKeyIsStripped() {
        downstreamReceivedInternalKey.set(false);

        webTestClient.get().uri("/api/content/pois")
                .header("X-Internal-Api-Key", "malicious-injected-key")
                .exchange()
                .expectStatus().isOk();

        assertThat(downstreamReceivedInternalKey.get())
                .as("Downstream service must NOT receive client-supplied X-Internal-Api-Key")
                .isFalse();
    }

    @Test
    void testRateLimitOnAnalyticsEvents() {
        rateLimitFilter.clearRateLimitCache();

        // First 60 requests should pass (200 OK)
        for (int i = 1; i <= 60; i++) {
            webTestClient.post().uri("/api/analytics/events")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue("{\"eventType\":\"SCAN\",\"poiId\":1}")
                    .exchange()
                    .expectStatus().isOk();
        }

        // 61st request must receive 429 Too Many Requests with Retry-After header
        webTestClient.post().uri("/api/analytics/events")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"eventType\":\"SCAN\",\"poiId\":1}")
                .exchange()
                .expectStatus().isEqualTo(429)
                .expectHeader().exists(HttpHeaders.RETRY_AFTER)
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.status").isEqualTo(429)
                .jsonPath("$.error").isEqualTo("Too Many Requests");
    }

    @Test
    void testActuatorExposesOnlyHealthWithoutDetails() {
        webTestClient.get().uri("/actuator/health")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("UP")
                .jsonPath("$.details").doesNotExist();

        // /actuator/info and /actuator/gateway should NOT be exposed (404)
        webTestClient.get().uri("/actuator/info")
                .exchange()
                .expectStatus().isNotFound();

        webTestClient.get().uri("/actuator/gateway/routes")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void headAnalyticsSummaryWithoutKeyReturns401() {
        int before = downstreamRequestCount.get();
        webTestClient.head().uri("/api/analytics/summary")
                .exchange()
                .expectStatus().isUnauthorized();
        assertThat(downstreamRequestCount.get())
                .as("Downstream must receive NOTHING for unauthorized HEAD request")
                .isEqualTo(before);
    }

    @Test
    void postAnalyticsSummaryWithoutKeyReturns401() {
        int before = downstreamRequestCount.get();
        webTestClient.post().uri("/api/analytics/summary")
                .exchange()
                .expectStatus().isUnauthorized();
        assertThat(downstreamRequestCount.get())
                .as("Downstream must receive NOTHING for unauthorized POST request")
                .isEqualTo(before);
    }

    @Test
    void deleteAnalyticsSummaryWithoutKeyReturns401() {
        int before = downstreamRequestCount.get();
        webTestClient.delete().uri("/api/analytics/summary")
                .exchange()
                .expectStatus().isUnauthorized();
        assertThat(downstreamRequestCount.get())
                .as("Downstream must receive NOTHING for unauthorized DELETE request")
                .isEqualTo(before);
    }

    @Test
    void headAnalyticsSummaryWithValidKeyIsForwarded() {
        int before = downstreamRequestCount.get();
        webTestClient.head().uri("/api/analytics/summary")
                .header("X-Admin-Key", TEST_ADMIN_KEY)
                .exchange()
                .expectStatus().isOk();
        assertThat(downstreamRequestCount.get())
                .as("Request with valid key must reach stub downstream backend")
                .isEqualTo(before + 1);
        assertThat(downstreamReceivedAdminKey.get())
                .as("X-Admin-Key must NOT be forwarded downstream")
                .isFalse();
    }
}

