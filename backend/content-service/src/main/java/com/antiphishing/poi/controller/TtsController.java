package com.antiphishing.poi.controller;

import com.antiphishing.poi.service.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TtsController {

    private final TtsService ttsService;

    @GetMapping(value = {"/api/tts", "/api/v1/tts"}, produces = "audio/mpeg")
    public ResponseEntity<byte[]> getTts(
            @RequestParam(defaultValue = "vi") String lang,
            @RequestParam String text) {

        byte[] audioBytes = ttsService.synthesize(lang, text);
        if (audioBytes == null || audioBytes.length == 0) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setContentLength(audioBytes.length);
        headers.setCacheControl("public, max-age=86400");

        return ResponseEntity.ok()
                .headers(headers)
                .body(audioBytes);
    }
}
