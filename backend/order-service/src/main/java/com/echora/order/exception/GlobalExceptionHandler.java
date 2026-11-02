package com.echora.order.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        log.warn("{} on {}: {}", status.value(), request.getRequestURI(), ex.getMessage());
        return buildProblemDetail(status, ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex,
                                                                      HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Validation failed", request, errors);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingRequestHeaderException.class})
    public ResponseEntity<Map<String, Object>> handleBadInput(Exception ex, HttpServletRequest request) {
        log.warn("Bad input on {}: {}", request.getRequestURI(), ex.getMessage());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Validation failed", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex, HttpServletRequest request) {
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatus status = HttpStatus.valueOf(errorResponse.getStatusCode().value());
            log.warn("{} on {}: {}", status.value(), request.getRequestURI(), ex.getMessage());
            return buildProblemDetail(status, ex.getMessage(), request, null);
        }
        log.error("Unexpected error on {}", request.getRequestURI(), ex);
        return buildProblemDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request, null);
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
