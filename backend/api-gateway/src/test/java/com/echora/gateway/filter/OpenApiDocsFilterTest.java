package com.echora.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiDocsFilterTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    @DisplayName("Khi docsEnabled=false: GET /v3/api-docs/auth trả về 404 RFC 7807 ProblemDetail")
    void disabledDocsReturns404ProblemDetail() throws Exception {
        OpenApiDocsFilter filter = new OpenApiDocsFilter();
        ReflectionTestUtils.setField(filter, "docsEnabled", false);

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/v3/api-docs/auth").build());

        AtomicBoolean forwarded = new AtomicBoolean(false);
        WebFilterChain chain = ex -> {
            forwarded.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(exchange.getResponse().getHeaders().getContentType())
                .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);

        String bodyStr = exchange.getResponse().getBodyAsString().block();
        JsonNode body = MAPPER.readTree(bodyStr);
        assertThat(body.get("status").asInt()).isEqualTo(404);
        assertThat(body.get("title").asText()).isEqualTo("Not Found");
        assertThat(body.get("detail").asText()).contains("Tài liệu API đã bị tắt");
        assertThat(body.get("instance").asText()).isEqualTo("/v3/api-docs/auth");
        assertThat(body.has("traceId")).isTrue();
    }

    @Test
    @DisplayName("Khi docsEnabled=false: GET /swagger-ui/index.html trả về 404 RFC 7807 ProblemDetail")
    void disabledSwaggerUiReturns404ProblemDetail() throws Exception {
        OpenApiDocsFilter filter = new OpenApiDocsFilter();
        ReflectionTestUtils.setField(filter, "docsEnabled", false);

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/swagger-ui/index.html").build());

        AtomicBoolean forwarded = new AtomicBoolean(false);
        WebFilterChain chain = ex -> {
            forwarded.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Khi docsEnabled=true: GET /v3/api-docs/auth chuyển tiếp qua filter chain")
    void enabledDocsForwardsDownstream() {
        OpenApiDocsFilter filter = new OpenApiDocsFilter();
        ReflectionTestUtils.setField(filter, "docsEnabled", true);

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/v3/api-docs/auth").build());

        AtomicBoolean forwarded = new AtomicBoolean(false);
        WebFilterChain chain = ex -> {
            forwarded.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isTrue();
    }

    @Test
    @DisplayName("Non-docs path /api/content/pois chuyển tiếp qua filter chain kể cả khi docsEnabled=false")
    void regularApiPathNotBlocked() {
        OpenApiDocsFilter filter = new OpenApiDocsFilter();
        ReflectionTestUtils.setField(filter, "docsEnabled", false);

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/content/pois").build());

        AtomicBoolean forwarded = new AtomicBoolean(false);
        WebFilterChain chain = ex -> {
            forwarded.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isTrue();
    }
}
