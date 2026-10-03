package com.antiphishing.poi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class TtsServiceImpl implements TtsService {

    private final RestTemplate restTemplate;
    private final Map<String, byte[]> audioCache = new ConcurrentHashMap<>();

    @Override
    public byte[] synthesize(String lang, String text) {
        if (text == null || text.isBlank()) {
            return new byte[0];
        }

        String targetLang = (lang != null && !lang.isBlank()) ? lang.trim().toLowerCase() : "vi";
        if (targetLang.contains("-")) {
            targetLang = targetLang.split("-")[0];
        }

        String hashKey = computeHash(targetLang + "_" + text.trim());

        // Check memory cache
        byte[] cached = audioCache.get(hashKey);
        if (cached != null) {
            log.info("TTS Cache HIT for key={}", hashKey);
            return cached;
        }

        log.info("TTS Cache MISS. Synthesizing audio for lang={}, text length={}", targetLang, text.length());

        try {
            String encodedText = URLEncoder.encode(text.trim(), StandardCharsets.UTF_8);
            String url = String.format("https://translate.google.com/translate_tts?ie=UTF-8&tl=%s&client=tw-ob&q=%s",
                    targetLang, encodedText);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.setAccept(java.util.Collections.singletonList(MediaType.ALL));
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                byte[] audioBytes = response.getBody();
                audioCache.put(hashKey, audioBytes);
                return audioBytes;
            }
        } catch (Exception ex) {
            log.error("Lỗi khi tải TTS từ Google: {}", ex.getMessage());
        }

        return new byte[0];
    }

    private String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }
}
