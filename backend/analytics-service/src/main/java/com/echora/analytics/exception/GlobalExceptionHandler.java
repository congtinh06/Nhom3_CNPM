package com.echora.analytics.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        for (ObjectError ge : ex.getBindingResult().getGlobalErrors()) {
            fieldErrors.put(ge.getObjectName(), ge.getDefaultMessage());
        }
        return buildProblemDetail(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequestException(BadRequestException ex, HttpServletRequest request) {
        return buildProblemDetail(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler({AnalyticsPublishException.class, AmqpException.class})
    public ResponseEntity<Map<String, Object>> handlePublishException(Exception ex, HttpServletRequest request) {
        log.error("Failed to publish analytics event to RabbitMQ: {}", ex.getMessage());
        return buildProblemDetail(HttpStatus.SERVICE_UNAVAILABLE, "Service is temporarily unable to process event due to message broker unavailability", request, null);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
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
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return buildProblemDetail(HttpStatus.CONFLICT, "Data conflict (duplicate or invalid reference)", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex, HttpServletRequest request) {
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
        Map<String, Object> body = new LinkedHashMap<>();
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
        return java.util.UUID.randomUUID().toString();
    }
}
