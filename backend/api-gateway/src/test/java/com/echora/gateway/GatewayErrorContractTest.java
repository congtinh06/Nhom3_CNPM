package com.echora.gateway;

import com.echora.gateway.filter.AdminAuthGlobalFilter;
import com.echora.gateway.filter.AnalyticsRateLimitGlobalFilter;
import com.echora.gateway.filter.UserAuthGlobalFilter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Dedicated contract tests for the gateway-emitted 401, 403 and 429 responses.
 * Every gateway error must be RFC 7807 ProblemDetail with
 * type, title, status, detail, instance and traceId.
 */
class GatewayErrorContractTest {

    private static final String SECRET = "test-secret-with-at-least-32-characters-for-hs256!";
    private static final String INTERNAL_KEY = "test-internal-api-key-with-at-least-32-chars";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    @DisplayName("UserAuthGlobalFilter 401 -> ProblemDetail with traceId")
    void missingTokenReturnsProblemDetail401() throws Exception {
        UserAuthGlobalFilter filter = new UserAuthGlobalFilter();
        ReflectionTestUtils.setField(filter, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(filter, "internalApiKey", INTERNAL_KEY);

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/orders").build());
        AtomicBoolean forwarded = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            forwarded.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        JsonNode body = assertProblem(exchange, 401, "Unauthorized");
        assertThat(body.get("detail").asText())
                .isEqualTo("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        assertThat(body.get("instance").asText()).isEqualTo("/api/orders");
        assertThat(forwarded).isFalse();
    }

    @Test
    @DisplayName("AdminAuthGlobalFilter 403 -> ProblemDetail for non-admin token")
    void nonAdminTokenReturnsProblemDetail403() throws Exception {
        AdminAuthGlobalFilter filter = new AdminAuthGlobalFilter();
        filter.setJwtSecret(SECRET);
        filter.setInternalApiKey(INTERNAL_KEY);

        String userToken = createToken("2", "USER");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .build());
        AtomicBoolean forwarded = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            forwarded.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        JsonNode body = assertProblem(exchange, 403, "Forbidden");
        assertThat(body.get("detail").asText()).isEqualTo("Bạn không có quyền thực hiện thao tác này.");
        assertThat(body.get("instance").asText()).isEqualTo("/api/admin/products");
        assertThat(forwarded).isFalse();
    }

    @Test
    @DisplayName("AnalyticsRateLimitGlobalFilter 429 -> ProblemDetail and Retry-After")
    void rateLimitReturnsProblemDetail429() throws Exception {
        AnalyticsRateLimitGlobalFilter filter = new AnalyticsRateLimitGlobalFilter();
        filter.setMaxRequestsPerMinute(1);
        filter.clearRateLimitCache();

        GatewayFilterChain chain = exchange -> Mono.empty();
        filter.filter(eventExchange(null), chain).block();
        MockServerWebExchange limited = eventExchange("trace-429");
        filter.filter(limited, chain).block();

        JsonNode body = assertProblem(limited, 429, "Too Many Requests");
        assertThat(body.get("detail").asText()).contains("Rate limit exceeded");
        assertThat(body.get("instance").asText()).isEqualTo("/api/analytics/events");
        assertThat(limited.getResponse().getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isNotBlank();
    }

    private MockServerWebExchange eventExchange(String traceId) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest
                .post("/api/analytics/events")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        if (traceId != null) {
            builder.header("X-Trace-Id", traceId);
        }
        return MockServerWebExchange.from(builder.build());
    }

    private JsonNode assertProblem(MockServerWebExchange exchange, int status, String title) throws Exception {
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.valueOf(status));
        assertThat(exchange.getResponse().getHeaders().getContentType())
                .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);

        JsonNode body = MAPPER.readTree(exchange.getResponse().getBodyAsString().block());
        assertThat(body.get("type").asText()).isEqualTo("https://api.echora.dev/problems/" + status);
        assertThat(body.get("title").asText()).isEqualTo(title);
        assertThat(body.get("status").asInt()).isEqualTo(status);
        assertThat(body.get("detail").asText()).isNotBlank();
        assertThat(body.get("instance").asText()).isNotBlank();
        assertThat(body.get("traceId").asText()).isNotBlank();
        assertThat(exchange.getResponse().getHeaders().getFirst("X-Trace-Id"))
                .isEqualTo(body.get("traceId").asText());
        return body;
    }

    private static String createToken(String subject, String role) {
        try {
            String header = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            Map<String, Object> payloadMap = new LinkedHashMap<>();
            payloadMap.put("sub", subject);
            payloadMap.put("role", role);
            payloadMap.put("status", "ACTIVE");
            payloadMap.put("exp", Instant.now().getEpochSecond() + 900);
            String payload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(MAPPER.writeValueAsBytes(payloadMap));
            String signingInput = header + "." + payload;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String signature = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.US_ASCII)));
            return signingInput + "." + signature;
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
