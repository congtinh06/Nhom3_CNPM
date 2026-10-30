package com.echora.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Adds essential security headers (X-Content-Type-Options, X-Frame-Options,
 * Referrer-Policy, Permissions-Policy, Content-Security-Policy) to all
 * gateway responses before response headers are committed.
 */
@Component
public class SecurityHeadersGlobalFilter implements GlobalFilter, Ordered {

    public static final String X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
    public static final String X_FRAME_OPTIONS = "X-Frame-Options";
    public static final String REFERRER_POLICY = "Referrer-Policy";
    public static final String PERMISSIONS_POLICY = "Permissions-Policy";
    public static final String CONTENT_SECURITY_POLICY = "Content-Security-Policy";

    public static final String X_CONTENT_TYPE_OPTIONS_VALUE = "nosniff";
    public static final String X_FRAME_OPTIONS_VALUE = "DENY";
    public static final String REFERRER_POLICY_VALUE = "strict-origin-when-cross-origin";
    public static final String PERMISSIONS_POLICY_VALUE = "geolocation=(self), camera=(self)";
    public static final String CSP_VALUE = "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://accounts.google.com https://*.google.com https://*.googleusercontent.com https://*.gstatic.com https://*.openstreetmap.org https://*.tile.openstreetmap.fr https://*.tile.opentopomap.org https://img.vietqr.io; media-src 'self' blob: data:; connect-src 'self' https://accounts.google.com https://*.gstatic.com; frame-src https://accounts.google.com; frame-ancestors 'none';";

    public static void applyHeaders(HttpHeaders headers) {
        if (!headers.containsKey(X_CONTENT_TYPE_OPTIONS)) {
            headers.set(X_CONTENT_TYPE_OPTIONS, X_CONTENT_TYPE_OPTIONS_VALUE);
        }
        if (!headers.containsKey(X_FRAME_OPTIONS)) {
            headers.set(X_FRAME_OPTIONS, X_FRAME_OPTIONS_VALUE);
        }
        if (!headers.containsKey(REFERRER_POLICY)) {
            headers.set(REFERRER_POLICY, REFERRER_POLICY_VALUE);
        }
        if (!headers.containsKey(PERMISSIONS_POLICY)) {
            headers.set(PERMISSIONS_POLICY, PERMISSIONS_POLICY_VALUE);
        }
        if (!headers.containsKey(CONTENT_SECURITY_POLICY)) {
            headers.set(CONTENT_SECURITY_POLICY, CSP_VALUE);
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        applyHeaders(exchange.getResponse().getHeaders());
        exchange.getResponse().beforeCommit(() -> {
            applyHeaders(exchange.getResponse().getHeaders());
            return Mono.empty();
        });
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
