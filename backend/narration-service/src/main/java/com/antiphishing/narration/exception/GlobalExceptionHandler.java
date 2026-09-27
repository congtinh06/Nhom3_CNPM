package com.antiphishing.narration.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = (error instanceof FieldError fieldError)
                    ? fieldError.getField()
                    : error.getObjectName();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Validation Failed", errors);
    }

    @ExceptionHandler(UnsupportedLocaleException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedLocale(UnsupportedLocaleException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Unsupported Locale", Map.of("locale", ex.getMessage()));
    }

    @ExceptionHandler(InvalidNarrationException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidNarration(InvalidNarrationException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Invalid Narration Request", Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Malformed Request Body",
                Map.of("message", "Request body is missing or malformed JSON."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Internal Server Error: ", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                Map.of("message", "An unexpected error occurred while generating the narration."));
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String error, Map<String, ?> details) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", status.value());
        response.put("error", error);
        response.putAll(details);
        return ResponseEntity.status(status).body(response);
    }
}
