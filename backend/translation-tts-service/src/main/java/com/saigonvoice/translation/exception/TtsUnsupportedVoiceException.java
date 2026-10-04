package com.saigonvoice.translation.exception;

public class TtsUnsupportedVoiceException extends TtsException {

    public TtsUnsupportedVoiceException(String message) {
        super(message);
    }

    public TtsUnsupportedVoiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
