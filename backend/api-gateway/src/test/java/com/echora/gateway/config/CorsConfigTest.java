package com.echora.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
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
        return preflight(filter, origin, HttpMethod.GET);
    }

    private static MockServerWebExchange preflight(CorsWebFilter filter, String origin, HttpMethod method) {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.options("http://localhost:8080/api/content/pois")
                        .header(HttpHeaders.ORIGIN, origin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, method.name())
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

    @Test
    void allowedMethodsCoverAdminPatchRequests() {
        CorsWebFilter filter = filterWith("https://ok.example.com", "");

        for (HttpMethod allowed : new HttpMethod[]{HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH}) {
            MockServerWebExchange exchange = preflight(filter, "https://ok.example.com", allowed);
            assertThat(isAllowed(exchange, "https://ok.example.com"))
                    .as("preflight for " + allowed + " must be allowed")
                    .isTrue();
            assertThat(exchange.getResponse().getHeaders().getAccessControlAllowMethods())
                    .containsExactlyInAnyOrder(
                            HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.OPTIONS);
        }

        for (HttpMethod rejected : new HttpMethod[]{HttpMethod.DELETE, HttpMethod.HEAD, HttpMethod.TRACE}) {
            MockServerWebExchange exchange = preflight(filter, "https://ok.example.com", rejected);
            assertThat(isAllowed(exchange, "https://ok.example.com"))
                    .as("preflight for " + rejected + " must be rejected")
                    .isFalse();
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Test
    void retryAfterHeaderIsExposedToBrowsers() {
        CorsWebFilter filter = filterWith("https://ok.example.com", "");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("http://localhost:8080/api/content/pois")
                        .header(HttpHeaders.ORIGIN, "https://ok.example.com")
                        .build());

        filter.filter(exchange, e -> Mono.empty()).block();

        assertThat(exchange.getResponse().getHeaders().getAccessControlExposeHeaders())
                .contains(HttpHeaders.RETRY_AFTER);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS))
                .isEqualTo("true");
    }
}
