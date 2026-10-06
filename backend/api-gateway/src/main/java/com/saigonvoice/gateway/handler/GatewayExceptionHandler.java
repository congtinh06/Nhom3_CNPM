package com.saigonvoice.gateway.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Handles errors and exceptions in the gateway pipeline.
 * Translates downstream connection refused to 503 Service Unavailable,
 * and downstream timeouts to 504 Gateway Timeout.
 * Emits short generic JSON response body with no stack trace or internal details.
 */
@Component
@Order(-2)
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GatewayExceptionHandler.class);

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        HttpStatus status;
        String errorMessage;

        if (isTimeoutError(ex)) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            errorMessage = "Gateway Timeout";
            log.warn("Gateway timeout on path '{}': {}", exchange.getRequest().getURI().getPath(), ex.getMessage());
        } else if (isConnectionError(ex)) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            errorMessage = "Service Unavailable";
            log.warn("Gateway connection failure on path '{}': {}", exchange.getRequest().getURI().getPath(), ex.getMessage());
        } else if (ex instanceof ResponseStatusException rse && rse.getStatusCode() instanceof HttpStatus httpStatus) {
            status = httpStatus;
            errorMessage = status.getReasonPhrase();
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorMessage = "Internal Server Error";
            log.error("Unhandled gateway error on path '{}': {}", exchange.getRequest().getURI().getPath(), ex.getMessage(), ex);
        }

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        byte[] jsonBytes = String.format("{\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                status.value(), errorMessage, errorMessage).getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
        return response.writeWith(Mono.just(buffer));
    }

    private boolean isTimeoutError(Throwable ex) {
        if (ex instanceof ResponseStatusException rse && rse.getStatusCode() == HttpStatus.GATEWAY_TIMEOUT) {
            return true;
        }
        Throwable current = ex;
        while (current != null) {
            String name = current.getClass().getName();
            if (name.contains("TimeoutException") ||
                    current instanceof java.util.concurrent.TimeoutException ||
                    current instanceof io.netty.handler.timeout.ReadTimeoutException ||
                    current instanceof io.netty.handler.timeout.WriteTimeoutException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean isConnectionError(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String name = current.getClass().getName();
            String msg = current.getMessage();
            if (current instanceof java.net.ConnectException ||
                    current instanceof java.net.NoRouteToHostException ||
                    current instanceof java.net.UnknownHostException ||
                    current instanceof io.netty.channel.ConnectTimeoutException ||
                    name.contains("AnnotatedConnectException") ||
                    name.contains("UnknownHostException") ||
                    (msg != null && (
                            msg.contains("Connection refused") ||
                            msg.contains("connection refused") ||
                            msg.contains("finishConnect(...) failed")
                    ))) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
