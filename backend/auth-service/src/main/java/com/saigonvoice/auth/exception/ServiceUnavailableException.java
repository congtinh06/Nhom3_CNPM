package com.saigonvoice.auth.exception;

import org.springframework.http.HttpStatus;

/**
 * Trả về 503 khi một tính năng phụ thuộc cấu hình bên ngoài chưa sẵn sàng
 * (ví dụ: đăng nhập Google khi chưa đặt GOOGLE_CLIENT_ID).
 */
public class ServiceUnavailableException extends ApiException {

    public ServiceUnavailableException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
