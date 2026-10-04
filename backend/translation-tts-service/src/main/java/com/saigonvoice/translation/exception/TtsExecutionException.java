package com.saigonvoice.translation.exception;

public class TtsExecutionException extends TtsException {

    private final int exitCode;
    private final String stderr;

    public TtsExecutionException(int exitCode, String stderr) {
        super("TTS command failed with exit code " + exitCode + ": " + stderr);
        this.exitCode = exitCode;
        this.stderr = stderr;
    }

    public TtsExecutionException(String message) {
        super(message);
        this.exitCode = -1;
        this.stderr = "";
    }

    public int getExitCode() {
        return exitCode;
    }

    public String getStderr() {
        return stderr;
    }
}
