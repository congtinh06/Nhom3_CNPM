package com.echora.translation.exception;

public class TranslationProviderException extends TranslationException {
    public TranslationProviderException(String message) {
        super(message);
    }

    public TranslationProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
