package com.saigonvoice.translation.controller;

import com.saigonvoice.translation.service.AudioStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/tts/audio")
@RequiredArgsConstructor
public class AudioController {

    private static final Pattern STRICT_FILE_NAME_PATTERN =
            Pattern.compile("^poi_[0-9]+_[a-z]{2,3}_[0-9a-f]{8}\\.mp3$");

    private static final long CHUNK_SIZE = 1024 * 1024L; // 1 MB chunk for range streaming

    // File names embed an 8-char content hash, so an audio response is immutable and
    // safe to cache. max-age=86400 lets mobile clients and the CDN reuse the bytes
    // instead of re-fetching on every play.
    private static final String AUDIO_CACHE_CONTROL = "public, max-age=86400";

    private final AudioStorageService audioStorageService;

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<ResourceRegion> getAudio(
            @PathVariable String fileName,
            @RequestHeader HttpHeaders headers) {

        // 1. Strict regex validation WITHOUT touching filesystem
        if (fileName == null || !STRICT_FILE_NAME_PATTERN.matcher(fileName).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // 2. Resolve safe path
        Path filePath;
        try {
            filePath = audioStorageService.resolveAudioPath(fileName);
        } catch (SecurityException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // 3. File existence and size check
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        long contentLength;
        try {
            contentLength = Files.size(filePath);
            if (contentLength == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (IOException e) {
            log.error("I/O error reading audio file {}: {}", filePath, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        Resource resource = new FileSystemResource(filePath);
        MediaType mediaType = MediaType.parseMediaType("audio/mpeg");

        // 4. HTTP Range handling
        List<HttpRange> ranges = headers.getRange();
        if (ranges.isEmpty()) {
            ResourceRegion region = new ResourceRegion(resource, 0, contentLength);
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, AUDIO_CACHE_CONTROL)
                    .body(region);
        }

        try {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(CHUNK_SIZE, end - start + 1);

            ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, AUDIO_CACHE_CONTROL)
                    .body(region);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + contentLength)
                    .build();
        }
    }
}
