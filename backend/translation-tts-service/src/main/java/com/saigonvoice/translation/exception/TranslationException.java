package com.saigonvoice.translation.exception;

public abstract class TranslationException extends RuntimeException {
    protected TranslationException(String message) {
        super(message);
    }

    protected TranslationException(String message, Throwable cause) {
        super(message, cause);
    }
}
