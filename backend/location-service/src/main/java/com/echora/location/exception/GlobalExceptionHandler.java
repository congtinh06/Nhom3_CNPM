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
import org.springframework.http.converter.HttpMessageNotReadableException;
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
        return badRequest(ex, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return badRequest(ex, request);
    }

    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<Map<String, Object>> handleNumberFormatException(NumberFormatException ex, HttpServletRequest request) {
        return badRequest(ex, request);
    }

    @ExceptionHandler({MissingServletRequestParameterException.class})
    public ResponseEntity<Map<String, Object>> handleMissingParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        return badRequest(ex, request);
    }

    private ResponseEntity<Map<String, Object>> badRequest(Exception ex, HttpServletRequest request) {
        String traceId = resolveTraceId(request);
        log.warn("Malformed request traceId={} on {}: {}", traceId, request.getRequestURI(), ex.toString());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, friendlyBadRequestDetail(ex), request, null, traceId);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(ConstraintViolationException ex, HttpServletRequest request) {
        log.warn("Bad request parameter: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Tham số trong yêu cầu không hợp lệ. Vui lòng kiểm tra lại giá trị đã gửi.", request, null);
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
        if (ex instanceof MethodArgumentTypeMismatchException || ex instanceof NumberFormatException) {
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
