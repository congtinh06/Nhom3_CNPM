package com.echora.translation.exception;

public class TtsTimeoutException extends TtsException {

    public TtsTimeoutException(String message) {
        super(message);
    }

    public TtsTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
