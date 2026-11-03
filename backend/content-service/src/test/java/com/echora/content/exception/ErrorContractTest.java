package com.echora.content.exception;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Shared error contract for every Echora service: RFC 7807 ProblemDetail with
 * type, title, status, detail, instance and traceId. Validation errors add an
 * errors map. The same schema is implemented by each service's exception
 * handler; this test locks the contract for 400, 403, 404, 409 and 500.
 * 401/403/429 emitted directly by gateway filters are covered by
 * GatewayErrorContractTest in api-gateway.
 */
class ErrorContractTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/content/test");
        return request;
    }

    private void assertProblem(ResponseEntity<Map<String, Object>> response, int status, String title) {
        assertEquals(status, response.getStatusCode().value());
        assertEquals(MediaType.APPLICATION_PROBLEM_JSON, response.getHeaders().getContentType());

        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("https://api.echora.dev/problems/" + status, body.get("type"));
        assertEquals(title, body.get("title"));
        assertEquals(status, body.get("status"));
        assertNotNull(body.get("detail"));
        assertEquals("/api/content/test", body.get("instance"));
        assertNotNull(body.get("traceId"));
        assertEquals(body.get("traceId"), response.getHeaders().getFirst("X-Trace-Id"));
    }

    @Test
    @DisplayName("400 BadRequestException -> ProblemDetail")
    void badRequestUsesProblemDetail() {
        assertProblem(handler.handleBadRequest(new BadRequestException("invalid input"), request()),
                HttpStatus.BAD_REQUEST.value(), "Bad Request");
    }

    @Test
    @DisplayName("400 validation -> ProblemDetail with errors map")
    void validationUsesProblemDetailWithErrors() {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new ValidationPayload(), "request");
        binding.rejectValue("slug", "invalid", "Slug is invalid");
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, binding);

        ResponseEntity<Map<String, Object>> response = handler.handleValidationErrors(exception, request());

        assertProblem(response, HttpStatus.BAD_REQUEST.value(), "Bad Request");
        @SuppressWarnings("unchecked")
        Map<String, String> errors = (Map<String, String>) response.getBody().get("errors");
        assertNotNull(errors);
        assertEquals("Slug is invalid", errors.get("slug"));
    }

    static class ValidationPayload {
        private String slug;

        public String getSlug() {
            return slug;
        }

        public void setSlug(String slug) {
            this.slug = slug;
        }
    }

    @Test
    @DisplayName("403 ForbiddenException -> ProblemDetail")
    void forbiddenUsesProblemDetail() {
        assertProblem(handler.handleForbidden(new ForbiddenException("premium required"), request()),
                HttpStatus.FORBIDDEN.value(), "Forbidden");
    }

    @Test
    @DisplayName("404 ResourceNotFoundException -> ProblemDetail")
    void notFoundUsesProblemDetail() {
        assertProblem(handler.handleNotFound(new ResourceNotFoundException("missing"), request()),
                HttpStatus.NOT_FOUND.value(), "Not Found");
    }

    @Test
    @DisplayName("409 ConflictException -> ProblemDetail")
    void conflictUsesProblemDetail() {
        assertProblem(handler.handleConflict(new ConflictException("stale version"), request()),
                HttpStatus.CONFLICT.value(), "Conflict");
    }

    @Test
    @DisplayName("500 unexpected exception -> ProblemDetail")
    void internalErrorUsesProblemDetail() {
        assertProblem(handler.handleGeneral(new RuntimeException("boom"), request()),
                HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error");
    }

    @Test
    @DisplayName("Incoming X-Trace-Id is echoed in body and response header")
    void traceIdIsPropagated() {
        MockHttpServletRequest request = request();
        request.addHeader("X-Trace-Id", "trace-abc-123");

        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(
                new ResourceNotFoundException("missing"), request);

        assertEquals("trace-abc-123", response.getBody().get("traceId"));
        assertEquals("trace-abc-123", response.getHeaders().getFirst("X-Trace-Id"));
    }

    @Test
    @DisplayName("Generated traceId is a non-blank UUID")
    void traceIdIsGeneratedWhenMissing() {
        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(new RuntimeException("boom"), request());
        String traceId = (String) response.getBody().get("traceId");
        assertTrue(traceId.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    }
}
