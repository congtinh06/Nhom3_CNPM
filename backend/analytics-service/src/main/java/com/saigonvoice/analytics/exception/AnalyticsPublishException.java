package com.saigonvoice.analytics.exception;

public class AnalyticsPublishException extends RuntimeException {

    public AnalyticsPublishException(String message) {
        super(message);
    }

    public AnalyticsPublishException(String message, Throwable cause) {
        super(message, cause);
    }
}
