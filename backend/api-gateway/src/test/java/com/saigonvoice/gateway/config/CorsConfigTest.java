package com.saigonvoice.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.reactive.CorsWebFilter;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private static CorsWebFilter filterWith(String frontendUrls, String frontendUrl) {
        CorsConfig config = new CorsConfig();
        ReflectionTestUtils.setField(config, "frontendUrls", frontendUrls);
        ReflectionTestUtils.setField(config, "frontendUrl", frontendUrl);
        return config.corsWebFilter();
    }

    private static MockServerWebExchange preflight(CorsWebFilter filter, String origin) {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.options("http://localhost:8080/api/content/pois")
                        .header(HttpHeaders.ORIGIN, origin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.PATCH.name())
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "ngrok-skip-browser-warning")
                        .build());
        filter.filter(exchange, e -> Mono.empty()).block();
        return exchange;
    }

    private static boolean isAllowed(MockServerWebExchange exchange, String origin) {
        return origin.equals(exchange.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void frontendUrlsListIsUsedAndTrimmed() {
        CorsWebFilter filter = filterWith(" https://a.example.com , https://b.example.com ,, ", "https://ignored.example.com");

        assertThat(isAllowed(preflight(filter, "https://a.example.com"), "https://a.example.com")).isTrue();
        assertThat(isAllowed(preflight(filter, "https://b.example.com"), "https://b.example.com")).isTrue();
        // FRONTEND_URL is only a fallback when FRONTEND_URLS is blank
        assertThat(isAllowed(preflight(filter, "https://ignored.example.com"), "https://ignored.example.com")).isFalse();
    }

    @Test
    void fallsBackToFrontendUrlWhenListIsBlank() {
        CorsWebFilter filter = filterWith("  ", "https://legacy.example.com");

        assertThat(isAllowed(preflight(filter, "https://legacy.example.com"), "https://legacy.example.com")).isTrue();
    }

    @Test
    void localhostDevOriginsAlwaysAllowed() {
        CorsWebFilter filter = filterWith("", "");

        assertThat(isAllowed(preflight(filter, "http://localhost:5173"), "http://localhost:5173")).isTrue();
        assertThat(isAllowed(preflight(filter, "http://127.0.0.1:5173"), "http://127.0.0.1:5173")).isTrue();
    }

    @Test
    void wildcardOriginIsNeverAllowedWithCredentials() {
        CorsWebFilter filter = filterWith("*, https://ok.example.com", "");

        MockServerWebExchange evil = preflight(filter, "https://evil.example.com");
        assertThat(evil.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)).isNull();
        assertThat(isAllowed(preflight(filter, "https://ok.example.com"), "https://ok.example.com")).isTrue();
    }
}
