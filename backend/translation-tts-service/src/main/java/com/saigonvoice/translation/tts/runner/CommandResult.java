package com.saigonvoice.translation.tts.runner;

public record CommandResult(int exitCode, String stderr, String stdout) {
}
