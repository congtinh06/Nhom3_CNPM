package com.echora.auth.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, Object>> handleTooManyRequests(TooManyRequestsException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        log.warn("Rate limited on {}: {}", request.getRequestURI(), ex.getMessage());
        ResponseEntity<Map<String, Object>> response = buildProblemDetail(status, ex.getMessage(), request, null);
        return ResponseEntity.status(status)
                .headers(response.getHeaders())
                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                .body(response.getBody());
    }

    @ExceptionHandler(FieldValidationException.class)
    public ResponseEntity<Map<String, Object>> handleFieldValidation(FieldValidationException ex, HttpServletRequest request) {
        Map<String, String> errors = ex.getDetails();
        log.warn("Service validation error on {}: {}", request.getRequestURI(), errors.keySet());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, ex.getMessage(), request, errors);
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        log.warn("{} on {}: {}", status.value(), request.getRequestURI(), ex.getMessage());
        return buildProblemDetail(status, ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (org.springframework.validation.FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        log.warn("Validation error on {}: {}", request.getRequestURI(), errors.keySet());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Validation failed", request, errors);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> handleMalformedRequest(Exception ex, HttpServletRequest request) {
        String traceId = resolveTraceId(request);
        log.warn("Malformed request traceId={} on {}: {}", traceId, request.getRequestURI(), ex.toString());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, friendlyBadRequestDetail(ex), request, null, traceId);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return buildProblemDetail(HttpStatus.CONFLICT, "Data conflict (duplicate or invalid reference)", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex, HttpServletRequest request) {
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatus status = HttpStatus.valueOf(errorResponse.getStatusCode().value());
            log.warn("{} on {}: {}", status.value(), request.getRequestURI(), ex.getMessage());
            return buildProblemDetail(status, ex.getMessage(), request, null);
        }
        log.error("Internal server error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildProblemDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request, null);
    }

    private ResponseEntity<Map<String, Object>> buildProblemDetail(HttpStatus status, String message, HttpServletRequest request, Map<String, String> errors) {
        return buildProblemDetail(status, message, request, errors, resolveTraceId(request));
    }

    private ResponseEntity<Map<String, Object>> buildProblemDetail(HttpStatus status, String message,
                                                                   HttpServletRequest request,
                                                                   Map<String, String> errors,
                                                                   String traceId) {
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

    /**
     * Friendly client-facing 400 detail. Never expose Java class names or Jackson internals.
     */
    static String friendlyBadRequestDetail(Exception ex) {
        if (ex instanceof HttpMessageNotReadableException) {
            return "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON và thử lại.";
        }
        if (ex instanceof MethodArgumentTypeMismatchException) {
            return "Tham số trong yêu cầu không hợp lệ. Vui lòng kiểm tra lại giá trị đã gửi.";
        }
        return "Thiếu tham số bắt buộc. Vui lòng kiểm tra lại yêu cầu.";
    }

    private String resolveTraceId(HttpServletRequest request) {
        String header = request.getHeader("X-Trace-Id");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }
}
