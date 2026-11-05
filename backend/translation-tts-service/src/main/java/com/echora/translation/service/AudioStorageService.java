package com.echora.translation.service;

import java.nio.file.Path;

public interface AudioStorageService {

    /**
     * Synthesizes and stores audio for a POI and language combination idempotently and atomically.
     *
     * @param poiId       numeric POI identifier > 0
     * @param lang        language code (2-3 lowercase letters)
     * @param contentHash 64-character lowercase hex SHA-256 hash
     * @param text        spoken text to synthesize
     * @return AudioStorageResult containing file name, audioUrl, path, and duration
     */
    AudioStorageResult storeAudio(long poiId, String lang, String contentHash, String text);

    /**
     * Như {@link #storeAudio(long, String, String, String)} nhưng có thể bỏ qua file cũ
     * để tạo lại audio (dùng cho thao tác admin).
     */
    default AudioStorageResult storeAudio(long poiId, String lang, String contentHash, String text, boolean force) {
        return storeAudio(poiId, lang, contentHash, text);
    }

    /**
     * Resolves an audio file name safely within the storage directory, asserting it does not escape.
     *
     * @param fileName file name matching the strict audio file pattern
     * @return normalized Path inside storage directory
     */
    Path resolveAudioPath(String fileName);
}
