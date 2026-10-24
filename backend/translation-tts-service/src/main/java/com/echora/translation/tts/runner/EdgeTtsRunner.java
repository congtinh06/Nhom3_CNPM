package com.echora.translation.tts.runner;

import com.echora.translation.exception.TtsEmptyOutputException;
import com.echora.translation.exception.TtsException;
import com.echora.translation.exception.TtsExecutionException;
import com.echora.translation.tts.SubtitleDurationParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class EdgeTtsRunner {

    private final CommandRunner commandRunner;
    private final String command;
    private final long timeoutMs;

    public EdgeTtsRunner(
            CommandRunner commandRunner,
            @Value("${app.tts.command:edge-tts}") String command,
            @Value("${app.tts.timeout-ms:30000}") long timeoutMs) {
        this.commandRunner = commandRunner;
        this.command = command;
        this.timeoutMs = timeoutMs;
    }

    /**
     * Synthesizes audio using edge-tts.
     *
     * @param voice                the Edge TTS voice identifier
     * @param text                 the text to synthesize
     * @param targetOutputFile     the destination audio file path
     * @param targetSubtitleFile   the destination subtitle file path (can be null if not needed)
     * @return duration in seconds, or null if subtitles could not be parsed
     * @throws TtsException on timeout, non-zero exit, or missing/empty output file
     */
    public Integer synthesize(String voice, String text, Path targetOutputFile, Path targetSubtitleFile) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Text to synthesize cannot be null or empty");
        }

        // Do NOT log the full text; log length only
        log.info("Starting edge-tts synthesis: voice='{}', textLength={}", voice, text.length());

        Path tempInputFile = null;
        try {
            // Pass text through a temporary UTF-8 file so text starting with '-' is never parsed as an option
            tempInputFile = Files.createTempFile("edge_tts_in_", ".txt");
            Files.writeString(tempInputFile, text, StandardCharsets.UTF_8);

            List<String> args = new ArrayList<>();
            args.add(command);
            args.add("--voice");
            args.add(voice);
            args.add("--file");
            args.add(tempInputFile.toAbsolutePath().toString());
            args.add("--write-media");
            args.add(targetOutputFile.toAbsolutePath().toString());
            if (targetSubtitleFile != null) {
                args.add("--write-subtitles");
                args.add(targetSubtitleFile.toAbsolutePath().toString());
            }

            CommandResult result = commandRunner.run(args, timeoutMs);

            if (result.exitCode() != 0) {
                String stderr = result.stderr() != null ? result.stderr() : "";
                if (stderr.length() > 500) {
                    stderr = stderr.substring(0, 500) + "...";
                }
                log.warn("edge-tts failed with exit code {}: {}", result.exitCode(), stderr);
                throw new TtsExecutionException(result.exitCode(), stderr);
            }

            if (!Files.exists(targetOutputFile) || Files.size(targetOutputFile) == 0) {
                log.warn("edge-tts output file is missing or empty at {}", targetOutputFile);
                throw new TtsEmptyOutputException("TTS output file is missing or empty: " + targetOutputFile);
            }

            log.info("edge-tts completed successfully: outputSize={} bytes", Files.size(targetOutputFile));

            // Extract duration from subtitles if available
            if (targetSubtitleFile != null && Files.exists(targetSubtitleFile) && Files.size(targetSubtitleFile) > 0) {
                Integer duration = SubtitleDurationParser.parseDurationSeconds(targetSubtitleFile);
                log.debug("Parsed audio duration: {}s", duration);
                return duration;
            }
            return null;

        } catch (IOException e) {
            throw new TtsException("I/O error during edge-tts preparation: " + e.getMessage(), e);
        } finally {
            if (tempInputFile != null) {
                try {
                    Files.deleteIfExists(tempInputFile);
                } catch (IOException ignored) {
                }
            }
        }
    }
}
