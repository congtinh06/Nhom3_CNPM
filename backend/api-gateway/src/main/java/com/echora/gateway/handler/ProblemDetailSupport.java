package com.echora.gateway.handler;

import com.echora.gateway.filter.SecurityHeadersGlobalFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Writes the shared RFC 7807 ProblemDetail body used by every gateway error path
 * (filters and the global exception handler).
 *
 * <p>Body: {@code type, title, status, detail, instance, traceId}. The trace id is
 * echoed in the {@code X-Trace-Id} response header and reused from the request when
 * the caller already supplied one.</p>
 */
public final class ProblemDetailSupport {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ProblemDetailSupport() {
    }

    public static Mono<Void> write(ServerWebExchange exchange, HttpStatus status, String detail) {
        ServerHttpResponse response = exchange.getResponse();
        String instance = exchange.getRequest().getURI().getPath();
        String traceId = resolveTraceId(exchange);

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        response.getHeaders().set("X-Trace-Id", traceId);
        SecurityHeadersGlobalFilter.applyHeaders(response.getHeaders());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "https://api.echora.dev/problems/" + status.value());
        body.put("title", status.getReasonPhrase());
        body.put("status", status.value());
        body.put("detail", detail);
        body.put("instance", instance);
        body.put("traceId", traceId);

        byte[] jsonBytes;
        try {
            jsonBytes = OBJECT_MAPPER.writeValueAsBytes(body);
        } catch (Exception ex) {
            jsonBytes = ("{\"type\":\"https://api.echora.dev/problems/" + status.value()
                    + "\",\"title\":\"" + escape(status.getReasonPhrase())
                    + "\",\"status\":" + status.value()
                    + ",\"detail\":\"" + escape(detail)
                    + "\",\"instance\":\"" + escape(instance)
                    + "\",\"traceId\":\"" + escape(traceId) + "\"}")
                    .getBytes(StandardCharsets.UTF_8);
        }
        DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
        return response.writeWith(Mono.just(buffer));
    }

    public static String resolveTraceId(ServerWebExchange exchange) {
        String traceId = exchange.getRequest().getHeaders().getFirst("X-Trace-Id");
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }
        return traceId;
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
