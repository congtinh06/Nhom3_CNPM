package com.saigonvoice.translation.exception;

public class TranslationQuotaExceededException extends TranslationException {
    public TranslationQuotaExceededException(String message) {
        super(message);
    }

    public TranslationQuotaExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
