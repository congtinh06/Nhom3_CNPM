package com.echora.content.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

/**
 * Writes the shared RFC 7807 ProblemDetail body for servlet filters and security
 * handlers: type, title, status, detail, instance, traceId (plus errors when given).
 */
public final class ProblemDetailWriter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ProblemDetailWriter() {
    }

    public static void write(HttpServletResponse response, HttpServletRequest request,
                             int status, String detail, Map<String, String> errors) throws IOException {
        HttpStatus httpStatus = HttpStatus.resolve(status);
        if (httpStatus == null) {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
            status = httpStatus.value();
        }
        String traceId = resolveTraceId(request);

        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("X-Trace-Id", traceId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "https://api.echora.dev/problems/" + status);
        body.put("title", httpStatus.getReasonPhrase());
        body.put("status", status);
        body.put("detail", detail);
        body.put("instance", request.getRequestURI());
        body.put("traceId", traceId);
        if (errors != null && !errors.isEmpty()) {
            body.put("errors", errors);
        }
        OBJECT_MAPPER.writeValue(response.getWriter(), body);
    }

    public static void write(HttpServletResponse response, HttpServletRequest request,
                             int status, String detail) throws IOException {
        write(response, request, status, detail, null);
    }

    private static String resolveTraceId(HttpServletRequest request) {
        String header = request.getHeader("X-Trace-Id");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }
}
