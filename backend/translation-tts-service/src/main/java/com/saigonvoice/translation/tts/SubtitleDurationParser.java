package com.saigonvoice.translation.tts;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public final class SubtitleDurationParser {

    private static final Pattern TIMING_PATTERN = Pattern.compile(
            "(\\d{2}):(\\d{2}):(\\d{2})[,.](\\d{3})\\s*-->\\s*(\\d{2}):(\\d{2}):(\\d{2})[,.](\\d{3})"
    );

    private SubtitleDurationParser() {
    }

    /**
     * Parses the last end timestamp in an SRT/WebVTT subtitle file and returns the
     * duration in seconds (rounded to nearest integer), or null if parsing fails.
     */
    public static Integer parseDurationSeconds(Path subtitleFile) {
        if (subtitleFile == null || !Files.exists(subtitleFile)) {
            return null;
        }

        try (BufferedReader reader = Files.newBufferedReader(subtitleFile, StandardCharsets.UTF_8)) {
            String line;
            Double lastEndTimeSeconds = null;

            while ((line = reader.readLine()) != null) {
                Matcher matcher = TIMING_PATTERN.matcher(line);
                if (matcher.find()) {
                    int endHours = Integer.parseInt(matcher.group(5));
                    int endMinutes = Integer.parseInt(matcher.group(6));
                    int endSeconds = Integer.parseInt(matcher.group(7));
                    int endMillis = Integer.parseInt(matcher.group(8));

                    lastEndTimeSeconds = endHours * 3600.0 + endMinutes * 60.0 + endSeconds + (endMillis / 1000.0);
                }
            }

            if (lastEndTimeSeconds != null && lastEndTimeSeconds >= 0) {
                return (int) Math.round(lastEndTimeSeconds);
            }
            return null;

        } catch (IOException | NumberFormatException e) {
            log.warn("Failed to parse subtitle duration from {}: {}", subtitleFile, e.getMessage());
            return null;
        }
    }
}
