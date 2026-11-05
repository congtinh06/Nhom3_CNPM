package com.echora.gateway.filter;

import com.echora.gateway.handler.ProblemDetailSupport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * OpenApiDocsFilter controls access to OpenAPI documentation and Swagger UI at the API Gateway.
 * When ECHORA_DOCS_ENABLED=false (default in deploy/production):
 * Any request to /v3/api-docs/** or /swagger-ui/** returns 404 Not Found with an RFC 7807
 * ProblemDetail body, ensuring zero documentation or route information is leaked.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class OpenApiDocsFilter implements WebFilter {

    @Value("${springdoc.api-docs.enabled:${ECHORA_DOCS_ENABLED:false}}")
    private boolean docsEnabled;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (isDocsPath(path) && !docsEnabled) {
            return ProblemDetailSupport.write(
                    exchange,
                    HttpStatus.NOT_FOUND,
                    "Tài liệu API đã bị tắt trên môi trường này."
            );
        }
        return chain.filter(exchange);
    }

    private boolean isDocsPath(String path) {
        if (path == null) {
            return false;
        }
        return path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.equals("/swagger-ui.html");
    }
}
