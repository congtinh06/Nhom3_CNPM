package com.echora.translation.tts.runner;

import com.echora.translation.exception.TtsException;
import com.echora.translation.exception.TtsTimeoutException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.*;

@Slf4j
@Component
public class ProcessCommandRunner implements CommandRunner {

    private static final int MAX_STREAM_CHARS = 1024;

    @Override
    public CommandResult run(List<String> command, long timeoutMs) throws TtsException {
        if (command == null || command.isEmpty()) {
            throw new IllegalArgumentException("Command cannot be null or empty");
        }

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(false);

        Process process;
        try {
            process = processBuilder.start();
        } catch (Exception e) {
            throw new TtsException("Failed to start command: " + command.get(0), e);
        }

        ExecutorService readerPool = Executors.newFixedThreadPool(2);
        Future<String> stderrFuture = readerPool.submit(() -> readStream(process.getErrorStream()));
        Future<String> stdoutFuture = readerPool.submit(() -> readStream(process.getInputStream()));

        boolean completed;
        try {
            completed = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            killProcessAndDescendants(process);
            throw new TtsException("Process execution was interrupted", e);
        } finally {
            readerPool.shutdown();
        }

        if (!completed) {
            log.warn("Process timed out after {}ms. Terminating process and descendants forcibly.", timeoutMs);
            killProcessAndDescendants(process);
            throw new TtsTimeoutException("TTS process timed out after " + timeoutMs + "ms");
        }

        int exitCode = process.exitValue();
        String stderr = "";
        String stdout = "";
        try {
            stderr = stderrFuture.get(1, TimeUnit.SECONDS);
            stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
        } catch (Exception ignored) {
        }

        return new CommandResult(exitCode, stderr, stdout);
    }

    private void killProcessAndDescendants(Process process) {
        try {
            process.descendants().forEach(handle -> {
                try {
                    handle.destroyForcibly();
                } catch (Exception ignored) {
                }
            });
            process.destroyForcibly();
        } catch (Exception e) {
            log.warn("Error while forcibly destroying process: {}", e.getMessage());
        }
    }

    private String readStream(InputStream inputStream) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            char[] buffer = new char[256];
            int read;
            while ((read = reader.read(buffer)) != -1) {
                if (sb.length() < MAX_STREAM_CHARS) {
                    int remaining = MAX_STREAM_CHARS - sb.length();
                    sb.append(buffer, 0, Math.min(read, remaining));
                }
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return "";
        }
    }
}
