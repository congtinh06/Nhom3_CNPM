package com.saigonvoice.translation.exception;

public class TranslationPayloadLimitException extends TranslationException {
    public TranslationPayloadLimitException(String message) {
        super(message);
    }

    public TranslationPayloadLimitException(String message, Throwable cause) {
        super(message, cause);
    }
}
