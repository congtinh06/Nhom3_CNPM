package com.saigonvoice.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * PathGuardFilter runs at the absolute highest precedence before any other gateway filter.
 * It inspects the raw, un-normalized request path and rejects with 400 Bad Request
 * (generic response body with no hints) any request containing:
 * - '%' (any percent-encoding)
 * - ';' (path/matrix parameters)
 * - '\' (backslash)
 * - control characters (ASCII < 0x20 or 0x7F)
 * - non-ASCII characters (> 127)
 * - '//' (consecutive slashes)
 * - '/./' or '/../' (dot segments)
 * - ends with '/.' or '/..'
 *
 * Subsequent filters are guaranteed to only observe canonical paths.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PathGuardFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(PathGuardFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String rawPath = request.getURI().getRawPath();

        if (isDisallowedRawPath(rawPath)) {
            log.warn("PathGuardFilter rejected suspicious raw path: '{}'", rawPath);
            return sendBadRequest(exchange);
        }

        return chain.filter(exchange);
    }

    private boolean isDisallowedRawPath(String path) {
        if (path == null) {
            return false;
        }

        // 1. Any percent-encoding, matrix param separator, backslash, or multiple slashes
        if (path.contains("%") ||
                path.contains(";") ||
                path.contains("\\") ||
                path.contains("//") ||
                path.contains("/./") ||
                path.contains("/../") ||
                path.endsWith("/.") ||
                path.endsWith("/..")) {
            return true;
        }

        // 2. Control characters and non-ASCII characters
        for (int i = 0; i < path.length(); i++) {
            char c = path.charAt(i);
            if (c < 0x20 || c == 0x7F || c > 127) {
                return true;
            }
        }

        return false;
    }

    private Mono<Void> sendBadRequest(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.BAD_REQUEST);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] jsonBytes = "{\"status\":400,\"error\":\"Bad Request\",\"message\":\"Bad Request\"}"
                .getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
        return response.writeWith(Mono.just(buffer));
    }
}
