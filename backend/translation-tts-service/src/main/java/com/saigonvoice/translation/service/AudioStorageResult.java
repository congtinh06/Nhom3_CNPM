package com.saigonvoice.translation.service;

import java.nio.file.Path;

public record AudioStorageResult(
        String fileName,
        String audioUrl,
        Path filePath,
        Integer durationSeconds,
        boolean newlyGenerated
) {
}
