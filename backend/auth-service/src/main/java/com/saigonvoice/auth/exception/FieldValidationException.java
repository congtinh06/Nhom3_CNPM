package com.saigonvoice.auth.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

/** Lỗi validate ở tầng service (không phải @Valid của Jakarta) nhưng vẫn trả lỗi theo từng ô. */
public class FieldValidationException extends ApiException {

    private final Map<String, String> details;

    public FieldValidationException(Map<String, String> details) {
        super(HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu không hợp lệ.");
        this.details = details;
    }

    public Map<String, String> getDetails() {
        return details;
    }
}
