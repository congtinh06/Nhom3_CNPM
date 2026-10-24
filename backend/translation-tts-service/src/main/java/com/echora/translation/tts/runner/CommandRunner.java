package com.echora.translation.tts.runner;

import com.echora.translation.exception.TtsException;

import java.util.List;

public interface CommandRunner {

    /**
     * Executes the given command argument list with a hard timeout.
     *
     * @param command   argument list (never a shell command)
     * @param timeoutMs maximum execution time in milliseconds
     * @return CommandResult containing exit code, stderr, and stdout
     * @throws TtsException if execution fails or times out
     */
    CommandResult run(List<String> command, long timeoutMs) throws TtsException;
}
