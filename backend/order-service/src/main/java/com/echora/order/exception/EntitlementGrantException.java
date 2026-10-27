package com.echora.order.exception;

/**
 * Loi khong the thu lai khi cap quyen (vi du: user khong con ton tai).
 * Loi mang/5xx duoc bieu dien bang ServiceUnavailableException de scheduler retry.
 */
public class EntitlementGrantException extends RuntimeException {

    public EntitlementGrantException(String message) {
        super(message);
    }
}
