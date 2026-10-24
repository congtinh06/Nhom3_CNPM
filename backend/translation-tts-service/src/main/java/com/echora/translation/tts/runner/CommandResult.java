package com.echora.translation.tts.runner;

public record CommandResult(int exitCode, String stderr, String stdout) {
}
