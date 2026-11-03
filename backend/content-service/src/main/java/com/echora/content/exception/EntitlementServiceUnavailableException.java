package com.echora.content.exception;

/**
 * Raised when auth-service cannot answer an entitlement check. Callers must fail closed
 * (deny access) instead of treating the outage as "user owns nothing".
 */
public class EntitlementServiceUnavailableException extends RuntimeException {

    public EntitlementServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
