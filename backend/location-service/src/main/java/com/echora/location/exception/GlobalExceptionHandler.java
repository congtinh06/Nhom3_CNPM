package com.echora.location.exception;

import feign.FeignException;
import feign.RetryableException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Validation error: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String paramName = ex.getName() != null ? ex.getName() : "parameter";
        String message = String.format("Parameter '%s' must be a valid number", paramName);
        log.warn("Parameter type mismatch: {}", message);
        return buildProblemDetail(HttpStatus.BAD_REQUEST, message, request, null);
    }

    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<Map<String, Object>> handleNumberFormatException(NumberFormatException ex, HttpServletRequest request) {
        log.warn("Number format error: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Parameter value must be a valid number", request, null);
    }

    @ExceptionHandler({
            MissingServletRequestParameterException.class,
            ConstraintViolationException.class
    })
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception ex, HttpServletRequest request) {
        log.warn("Bad request parameter: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Invalid request parameters: " + ex.getMessage(), request, null);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.info("Resource not found: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    @ExceptionHandler(FeignException.NotFound.class)
    public ResponseEntity<Map<String, Object>> handleFeignNotFound(FeignException.NotFound ex, HttpServletRequest request) {
        log.info("Upstream resource not found: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.NOT_FOUND, "Resource not found in content-service", request, null);
    }

    @ExceptionHandler(RetryableException.class)
    public ResponseEntity<Map<String, Object>> handleFeignTimeout(RetryableException ex, HttpServletRequest request) {
        log.error("Content-service timeout or connection refused: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.SERVICE_UNAVAILABLE, "Content-service is currently unavailable or timed out", request, null);
    }

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Map<String, Object>> handleFeignException(FeignException ex, HttpServletRequest request) {
        log.error("Feign client error (status {}): {}", ex.status(), ex.getMessage());
        if (ex.status() == 404) {
            return buildProblemDetail(HttpStatus.NOT_FOUND, "Resource not found in content-service", request, null);
        }
        return buildProblemDetail(HttpStatus.SERVICE_UNAVAILABLE, "Content-service returned an error or is unavailable", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex, HttpServletRequest request) {
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatus status = HttpStatus.valueOf(errorResponse.getStatusCode().value());
            log.warn("{} on {}: {}", status.value(), request.getRequestURI(), ex.getMessage());
            return buildProblemDetail(status, ex.getMessage(), request, null);
        }
        log.error("Internal server error: ", ex);
        return buildProblemDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request, null);
    }

    private ResponseEntity<Map<String, Object>> buildProblemDetail(HttpStatus status, String message, HttpServletRequest request, Map<String, String> errors) {
        String traceId = resolveTraceId(request);
        Map<String, Object> body = new HashMap<>();
        body.put("type", "https://api.echora.dev/problems/" + status.value());
        body.put("title", status.getReasonPhrase());
        body.put("status", status.value());
        body.put("detail", message);
        body.put("instance", request.getRequestURI());
        body.put("traceId", traceId);
        if (errors != null) {
            body.put("errors", errors);
        }
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .header("X-Trace-Id", traceId)
                .body(body);
    }

    private String resolveTraceId(HttpServletRequest request) {
        String header = request.getHeader("X-Trace-Id");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }
}
