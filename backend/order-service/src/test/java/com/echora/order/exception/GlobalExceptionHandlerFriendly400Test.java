package com.echora.order.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerFriendly400Test {

    private static final String BAD_JSON =
            "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON và thử lại.";
    private static final String BAD_PARAMETER =
            "Tham số trong yêu cầu không hợp lệ. Vui lòng kiểm tra lại giá trị đã gửi.";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HttpMessageNotReadableException returns a friendly Vietnamese detail and keeps traceId")
    void unreadableBodyIsFriendly() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/orders");
        request.addHeader("X-Trace-Id", "trace-400-json");
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException(
                "JSON parse error: Cannot deserialize value of type `java.lang.Long`",
                new MockHttpInputMessage(new byte[0]));

        assertFriendly(handler.handleBadInput(ex, request), BAD_JSON, "trace-400-json");
    }

    @Test
    @DisplayName("MethodArgumentTypeMismatchException returns a friendly Vietnamese detail")
    void typeMismatchIsFriendly() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/orders/abc");
        request.addHeader("X-Trace-Id", "trace-400-param");
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Long.class, "id", null, new NumberFormatException("For input string: abc"));

        assertFriendly(handler.handleBadInput(ex, request), BAD_PARAMETER, "trace-400-param");
    }

    private static void assertFriendly(ResponseEntity<Map<String, Object>> response,
                                       String expectedDetail,
                                       String traceId) {
        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody())
                .containsEntry("status", 400)
                .containsEntry("detail", expectedDetail)
                .containsEntry("traceId", traceId);
        assertThat(response.getHeaders().getFirst("X-Trace-Id")).isEqualTo(traceId);
        assertThat(String.valueOf(response.getBody().get("detail")))
                .doesNotContain("java.", "Exception", "Long", "Cannot deserialize", "NumberFormat");
    }
}
