package com.echora.translation.exception;

public class TtsEmptyOutputException extends TtsException {

    public TtsEmptyOutputException(String message) {
        super(message);
    }

    public TtsEmptyOutputException(String message, Throwable cause) {
        super(message, cause);
    }
}
