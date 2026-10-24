package com.echora.content.exception;

/** Xung đột cập nhật đồng thời (optimistic lock) -> HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
