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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Import(ApiGatewayApplicationTest.TestRouteConfig.class)
class ApiGatewayApplicationTest {

    private static final int REFUSED_PORT = allocateRefusedPort();
    private static ExecutorService mockServerExecutor;

    private static int allocateRefusedPort() {
        try (ServerSocket socket = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"))) {
            return socket.getLocalPort();
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to allocate closed port", e);
        }
    }

    @TestConfiguration
    static class TestRouteConfig {
        @Bean
        public RouteLocator testRoutes(RouteLocatorBuilder builder) {
            return builder.routes()
                    .route("refused-service", r -> r.path("/api/location/refused/**")
                            .uri("http://127.0.0.1:" + REFUSED_PORT))
                    .route("unknown-host-service", r -> r.path("/api/location/unknown-host/**")
                            .uri("http://nonexistent-host.invalid:8080"))
                    .build();
        }
    }

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
        mockDownstreamServer.createContext("/api/location/timeout", exchange -> {
            try {
                Thread.sleep(10000);
            } catch (InterruptedException ignored) {
            }
        });
        mockServerExecutor = Executors.newCachedThreadPool(r -> {
            Thread t = new Thread(r, "mock-downstream-worker");
            t.setDaemon(true);
            return t;
        });
        mockDownstreamServer.setExecutor(mockServerExecutor);
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
        if (mockServerExecutor != null) {
            mockServerExecutor.shutdownNow();
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
        registry.add("GATEWAY_RESPONSE_TIMEOUT", () -> "2s");
        registry.add("GATEWAY_CONNECT_TIMEOUT_MS", () -> "1000");
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

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("publicPathsCases")
    void testPublicPathsRouting(String name, HttpMethod method, String uri, String jsonBody) {
        WebTestClient.RequestHeadersSpec<?> requestSpec;
        if (HttpMethod.POST.equals(method)) {
            requestSpec = webTestClient.post().uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(jsonBody);
        } else {
            requestSpec = webTestClient.get().uri(uri);
        }

        requestSpec.exchange()
                .expectStatus().isOk();
    }

    private static Stream<Arguments> publicPathsCases() {
        return Stream.of(
                Arguments.of("content-categories", HttpMethod.GET, "/api/content/categories", null),
                Arguments.of("content-pois", HttpMethod.GET, "/api/content/pois", null),
                Arguments.of("content-pois-by-id", HttpMethod.GET, "/api/content/pois/10", null),
                Arguments.of("content-pois-qr", HttpMethod.GET, "/api/content/pois/qr/sample-token", null),
                Arguments.of("content-routes", HttpMethod.GET, "/api/content/routes", null),
                Arguments.of("content-routes-by-id", HttpMethod.GET, "/api/content/routes/5", null),
                Arguments.of("content-zones", HttpMethod.GET, "/api/content/zones", null),
                Arguments.of("content-zones-by-id", HttpMethod.GET, "/api/content/zones/2", null),
                Arguments.of("location-nearby", HttpMethod.GET, "/api/location/nearby?lat=10.77&lng=106.69&radius=500", null),
                Arguments.of("location-resolve", HttpMethod.GET, "/api/location/resolve?lat=10.77&lng=106.69", null),
                Arguments.of("location-qr", HttpMethod.GET, "/api/location/qr/test-token", null),
                Arguments.of("tts-audio", HttpMethod.GET, "/api/tts/audio/poi_1_vi_12345678.mp3", null),
                Arguments.of("analytics-events", HttpMethod.POST, "/api/analytics/events",
                        "{\"eventType\":\"SCAN\",\"poiId\":1,\"languageCode\":\"vi\",\"triggerType\":\"QR\"}")
        );
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

    // ==========================================
    // Task 1 & 2: Timeouts and Backend Down Tests
    // ==========================================

    @Test
    void backendNeverAnswersTimesOutWithinConfiguredTime() {
        long start = System.currentTimeMillis();
        webTestClient.get().uri("/api/location/timeout")
                .exchange()
                .expectStatus().isEqualTo(504);
        long elapsed = System.currentTimeMillis() - start;
        assertThat(elapsed)
                .as("Gateway must answer within configured timeout, not hang")
                .isLessThan(8000L);
    }

    @Test
    void backendDownConnectionRefusedReturns503() {
        webTestClient.get().uri("/api/location/refused/service")
                .exchange()
                .expectStatus().isEqualTo(503)
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.status").isEqualTo(503)
                .jsonPath("$.error").isEqualTo("Service Unavailable")
                .jsonPath("$.message").isEqualTo("Service Unavailable")
                .jsonPath("$.trace").doesNotExist();
    }

    @Test
    void backendDownTimeoutReturns504() {
        webTestClient.get().uri("/api/location/timeout")
                .exchange()
                .expectStatus().isEqualTo(504)
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.status").isEqualTo(504)
                .jsonPath("$.error").isEqualTo("Gateway Timeout")
                .jsonPath("$.message").isEqualTo("Gateway Timeout")
                .jsonPath("$.trace").doesNotExist();
    }

    @Test
    void backendUnknownHostReturns503() {
        webTestClient.get().uri("/api/location/unknown-host/service")
                .exchange()
                .expectStatus().isEqualTo(503)
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.status").isEqualTo(503)
                .jsonPath("$.error").isEqualTo("Service Unavailable")
                .jsonPath("$.message").isEqualTo("Service Unavailable")
                .jsonPath("$.trace").doesNotExist();
    }

    // ==========================================
    // Task 3: CORS Hardening Tests
    // ==========================================

    @Test
    void disallowedOriginGetsNoAccessControlAllowOrigin() {
        webTestClient.get().uri("/api/content/pois")
                .header("Origin", "http://disallowed-evil.com")
                .exchange()
                .expectHeader().doesNotExist("Access-Control-Allow-Origin");
    }

    @Test
    void deletePreflightNotAllowed() {
        webTestClient.options().uri("http://localhost:" + port + "/api/content/pois")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "DELETE")
                .exchange()
                .expectStatus().isForbidden()
                .expectHeader().doesNotExist("Access-Control-Allow-Origin");
    }

    // ==========================================
    // Task 5: PathGuardFilter Uncovered Path Variants Tests
    // ==========================================

    @Test
    void backslashEncodedPathReturns400() {
        int before = downstreamRequestCount.get();
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois%5Ctest")
                .exchange()
                .expectStatus().isBadRequest();
        assertThat(downstreamRequestCount.get())
                .as("Downstream receives nothing for %5C backslash")
                .isEqualTo(before);
    }

    @Test
    void backslashRawPathReturns400() throws Exception {
        int before = downstreamRequestCount.get();
        try (Socket socket = new Socket("127.0.0.1", port)) {
            OutputStream os = socket.getOutputStream();
            os.write("GET /api/content/pois\\test HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n"
                    .getBytes(StandardCharsets.US_ASCII));
            os.flush();
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(socket.getInputStream(), StandardCharsets.US_ASCII));
            String statusLine = reader.readLine();
            assertThat(statusLine)
                    .as("Gateway must return 400 Bad Request for raw backslash")
                    .contains("400");
        }
        assertThat(downstreamRequestCount.get())
                .as("Downstream receives nothing for raw backslash")
                .isEqualTo(before);
    }

    @Test
    void controlCharEncodedPathReturns400() {
        int before = downstreamRequestCount.get();
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois%00test")
                .exchange()
                .expectStatus().isBadRequest();
        assertThat(downstreamRequestCount.get())
                .as("Downstream receives nothing for %00 control char")
                .isEqualTo(before);
    }

    @Test
    void nonAsciiEncodedPathReturns400() {
        int before = downstreamRequestCount.get();
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois%E2%80%AEtest")
                .exchange()
                .expectStatus().isBadRequest();
        assertThat(downstreamRequestCount.get())
                .as("Downstream receives nothing for non-ASCII %E2%80%AE")
                .isEqualTo(before);
    }

    @Test
    void pathEndingWithSlashDotReturns400() {
        int before = downstreamRequestCount.get();
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois/.")
                .exchange()
                .expectStatus().isBadRequest();
        assertThat(downstreamRequestCount.get())
                .as("Downstream receives nothing for path ending with /.")
                .isEqualTo(before);
    }

    @Test
    void pathEndingWithSlashDotDotReturns400() {
        int before = downstreamRequestCount.get();
        webTestClient.get().uri("http://localhost:" + port + "/api/content/pois/..")
                .exchange()
                .expectStatus().isBadRequest();
        assertThat(downstreamRequestCount.get())
                .as("Downstream receives nothing for path ending with /..")
                .isEqualTo(before);
    }
}

