package com.echora.translation.exception;

public class TranslationTimeoutException extends TranslationException {
    public TranslationTimeoutException(String message) {
        super(message);
    }

    public TranslationTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
