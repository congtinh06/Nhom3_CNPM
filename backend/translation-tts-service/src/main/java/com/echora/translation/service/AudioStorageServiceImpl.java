package com.echora.translation.service;

import com.echora.translation.exception.TtsException;
import com.echora.translation.tts.TtsVoiceProvider;
import com.echora.translation.tts.runner.EdgeTtsRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.regex.Pattern;

@Slf4j
@Service
public class AudioStorageServiceImpl implements AudioStorageService {

    private static final Pattern LANG_PATTERN = Pattern.compile("^[a-z]{2,3}$");
    private static final Pattern HASH_PATTERN = Pattern.compile("^[0-9a-f]{64}$");
    private static final Pattern STRICT_FILE_NAME_PATTERN =
            Pattern.compile("^poi_[0-9]+_[a-z]{2,3}_[0-9a-f]{8}\\.mp3$");

    private final TtsVoiceProvider ttsVoiceProvider;
    private final EdgeTtsRunner edgeTtsRunner;
    private final String storageDir;
    private final String publicBaseUrl;

    public AudioStorageServiceImpl(
            TtsVoiceProvider ttsVoiceProvider,
            EdgeTtsRunner edgeTtsRunner,
            @Value("${app.audio.storage-dir:/app/storage/audio}") String storageDir,
            @Value("${app.audio.public-base-url:}") String publicBaseUrl) {
        this.ttsVoiceProvider = ttsVoiceProvider;
        this.edgeTtsRunner = edgeTtsRunner;
        this.storageDir = storageDir;
        this.publicBaseUrl = publicBaseUrl != null ? publicBaseUrl.trim() : "";
    }

    @Override
    public AudioStorageResult storeAudio(long poiId, String lang, String contentHash, String text) {
        // 1. Validation BEFORE building any path
        if (poiId <= 0) {
            throw new IllegalArgumentException("poiId must be a positive integer, got: " + poiId);
        }
        if (lang == null || !LANG_PATTERN.matcher(lang).matches()) {
            throw new IllegalArgumentException("lang must match ^[a-z]{2,3}$, got: " + lang);
        }
        if (contentHash == null || !HASH_PATTERN.matcher(contentHash).matches()) {
            throw new IllegalArgumentException("contentHash must match ^[0-9a-f]{64}$, got: " + contentHash);
        }
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Text to synthesize cannot be null or empty");
        }

        String hash8 = contentHash.substring(0, 8);
        String fileName = "poi_" + poiId + "_" + lang + "_" + hash8 + ".mp3";

        // 2. Resolve against storage-dir, normalize, and assert path traversal protection
        Path baseDir = Paths.get(storageDir).toAbsolutePath().normalize();
        Path targetFile = baseDir.resolve(fileName).normalize();
        if (!targetFile.startsWith(baseDir)) {
            throw new SecurityException("Path traversal attempt detected for file: " + fileName);
        }

        try {
            Files.createDirectories(baseDir);

            // 3. Idempotent check: if non-empty file already exists, reuse without calling edge-tts
            if (Files.exists(targetFile) && Files.size(targetFile) > 0) {
                log.info("Audio file already exists for poiId={}, lang={}, hash8={}: reusing {}", poiId, lang, hash8, fileName);
                return new AudioStorageResult(fileName, buildAudioUrl(fileName), targetFile, null, false);
            }
        } catch (IOException e) {
            throw new TtsException("Failed to access audio storage directory: " + baseDir, e);
        }

        // 4. Voice lookup
        String voice = ttsVoiceProvider.getVoice(lang);

        // 5. Atomic write: synthesize to temp file in SAME directory, move atomically, clean up on failure
        Path tempOutputFile = null;
        Path tempSubtitleFile = null;
        try {
            tempOutputFile = Files.createTempFile(baseDir, ".tmp_" + fileName + "_", ".tmp");
            tempSubtitleFile = Files.createTempFile(baseDir, ".tmp_sub_" + fileName + "_", ".vtt");

            Integer duration = edgeTtsRunner.synthesize(voice, text, tempOutputFile, tempSubtitleFile);

            Files.move(tempOutputFile, targetFile, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            log.info("Audio saved atomically to {}", targetFile);

            return new AudioStorageResult(fileName, buildAudioUrl(fileName), targetFile, duration, true);

        } catch (Exception e) {
            if (tempOutputFile != null) {
                try {
                    Files.deleteIfExists(tempOutputFile);
                } catch (IOException ignored) {
                }
            }
            if (e instanceof RuntimeException re) {
                throw re;
            }
            throw new TtsException("Failed to synthesize or store audio: " + e.getMessage(), e);
        } finally {
            if (tempSubtitleFile != null) {
                try {
                    Files.deleteIfExists(tempSubtitleFile);
                } catch (IOException ignored) {
                }
            }
        }
    }

    @Override
    public Path resolveAudioPath(String fileName) {
        if (fileName == null || !STRICT_FILE_NAME_PATTERN.matcher(fileName).matches()) {
            throw new IllegalArgumentException("Invalid audio file name format: " + fileName);
        }

        Path baseDir = Paths.get(storageDir).toAbsolutePath().normalize();
        Path resolved = baseDir.resolve(fileName).normalize();
        if (!resolved.startsWith(baseDir)) {
            throw new SecurityException("Path traversal attempt detected: " + fileName);
        }
        return resolved;
    }

    private String buildAudioUrl(String fileName) {
        String relativeUrl = "/api/tts/audio/" + fileName;
        if (!publicBaseUrl.isEmpty()) {
            return publicBaseUrl.replaceAll("/+$", "") + relativeUrl;
        }
        return relativeUrl;
    }
}
