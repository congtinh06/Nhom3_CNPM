package com.saigonvoice.translation.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.translation.exception.TranslationProviderException;
import com.saigonvoice.translation.exception.TranslationQuotaExceededException;
import com.saigonvoice.translation.exception.TranslationTimeoutException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Locale;

/**
 * Translation provider using MyMemory REST API.
 *
 * Official documentation references:
 * 1. Per-request limit: 'q' parameter is limited to max 500 bytes (UTF-8).
 *    Source: https://mymemory.translated.net/doc/spec.php (Section "Get", Parameter table for 'q')
 * 2. Daily character quotas:
 *    - Free, anonymous: 5,000 chars/day
 *    - Valid email ('de' parameter): 50,000 chars/day
 *    - Whitelisted CAT tools: 150,000 chars/day
 *    Source: https://mymemory.translated.net/doc/usagelimits.php (Section "Get")
 */
@Slf4j
@Component
public class MyMemoryTranslationProvider implements TranslationProvider {

    public static final String PROVIDER_NAME = "mymemory";
    public static final int DEFAULT_MAX_CHUNK_BYTES = 450;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String email;
    private final int maxChunkBytes;

    public MyMemoryTranslationProvider(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.translation.mymemory.base-url:https://api.mymemory.translated.net}") String baseUrl,
            @Value("${app.translation.mymemory.email:${MYMEMORY_EMAIL:}}") String email,
            @Value("${app.translation.mymemory.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.translation.mymemory.read-timeout-ms:10000}") int readTimeoutMs,
            @Value("${app.translation.mymemory.max-chunk-bytes:450}") int maxChunkBytes
    ) {
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.email = (email != null && !email.isBlank()) ? email.trim() : null;
        this.maxChunkBytes = maxChunkBytes > 0 ? maxChunkBytes : DEFAULT_MAX_CHUNK_BYTES;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Constructor for unit tests with preconfigured RestClient or MockRestServiceServer.
     */
    public MyMemoryTranslationProvider(
            RestClient restClient,
            ObjectMapper objectMapper,
            String baseUrl,
            String email,
            int maxChunkBytes
    ) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.email = (email != null && !email.isBlank()) ? email.trim() : null;
        this.maxChunkBytes = maxChunkBytes > 0 ? maxChunkBytes : DEFAULT_MAX_CHUNK_BYTES;
    }

    @Override
    public String name() {
        return PROVIDER_NAME;
    }

    @Override
    public TranslatedText translate(String sourceText, String sourceLang, String targetLang) {
        validateLanguages(sourceLang, targetLang);
        if (sourceText == null || sourceText.isBlank()) {
            return new TranslatedText("");
        }

        String trimmed = sourceText.trim();
        if (trimmed.getBytes(StandardCharsets.UTF_8).length <= maxChunkBytes) {
            String translated = callMyMemory(trimmed, sourceLang, targetLang);
            return new TranslatedText(translated);
        }

        List<String> chunks = TextChunker.split(trimmed, maxChunkBytes);
        StringBuilder reassembled = new StringBuilder();
        for (String chunk : chunks) {
            String translatedChunk = callMyMemory(chunk, sourceLang, targetLang);
            if (reassembled.length() > 0) {
                reassembled.append(" ");
            }
            reassembled.append(translatedChunk);
        }
        return new TranslatedText(reassembled.toString());
    }

    private String callMyMemory(String textChunk, String sourceLang, String targetLang) {
        String cleanSource = sourceLang.trim().toLowerCase(Locale.ROOT);
        String cleanTarget = targetLang.trim().toLowerCase(Locale.ROOT);
        String langPair = cleanSource + "|" + cleanTarget;

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(baseUrl)
                .path("/get")
                .queryParam("q", textChunk)
                .queryParam("langpair", langPair);

        if (email != null && !email.isBlank()) {
            uriBuilder.queryParam("de", email);
        }

        URI uri = uriBuilder.build().encode(StandardCharsets.UTF_8).toUri();

        log.debug("Invoking MyMemory API for langpair={} with text length={}", langPair, textChunk.length());

        String responseBody;
        try {
            responseBody = restClient.get()
                    .uri(uri)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);
        } catch (ResourceAccessException e) {
            log.warn("Connection or read timeout calling MyMemory for langpair={}: {}", langPair, e.getMessage());
            throw new TranslationTimeoutException("Connection or read timeout contacting MyMemory translation API", e);
        } catch (RestClientResponseException e) {
            int statusCode = e.getStatusCode().value();
            String errBody = e.getResponseBodyAsString();
            log.warn("MyMemory HTTP error {} for langpair={}", statusCode, langPair);
            if (statusCode == 429 || (statusCode == 403 && isQuotaWarning(errBody))) {
                throw new TranslationQuotaExceededException("MyMemory daily quota exceeded (HTTP " + statusCode + ")");
            }
            throw new TranslationProviderException("MyMemory HTTP error " + statusCode + ": " + errBody, e);
        }

        return extractTranslationFromResponse(responseBody, langPair);
    }

    private String extractTranslationFromResponse(String responseBody, String langPair) {
        if (responseBody == null || responseBody.isBlank()) {
            throw new TranslationProviderException("Empty response body received from MyMemory for langpair=" + langPair);
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (Exception e) {
            throw new TranslationProviderException("Failed to parse MyMemory JSON response: " + e.getMessage(), e);
        }

        boolean quotaFinished = root.path("quotaFinished").asBoolean(false);
        int responseStatus = root.path("responseStatus").asInt(200);
        String responseDetails = root.path("responseDetails").asText(null);
        String translatedText = root.path("responseData").path("translatedText").asText(null);

        // Check for quota exhaustion
        boolean isQuota = quotaFinished
                || responseStatus == 429
                || isQuotaWarning(translatedText)
                || isQuotaWarning(responseDetails);

        if (isQuota) {
            String msg = (responseDetails != null && !responseDetails.isBlank()) ? responseDetails : translatedText;
            if (msg == null || msg.isBlank()) {
                msg = "MyMemory daily quota exceeded (status=" + responseStatus + ")";
            }
            throw new TranslationQuotaExceededException(msg);
        }

        // Check for HTTP/API level errors inside body
        if (responseStatus != 200) {
            String msg = (responseDetails != null && !responseDetails.isBlank()) ? responseDetails : "Status " + responseStatus;
            throw new TranslationProviderException("MyMemory error (" + responseStatus + "): " + msg);
        }

        // Check for provider warning prefix returned as translated text
        if (translatedText != null && isProviderWarning(translatedText)) {
            throw new TranslationProviderException("MyMemory error reported in translation output: " + translatedText);
        }

        // Reject empty or blank translation results
        if (translatedText == null || translatedText.trim().isEmpty()) {
            String details = (responseDetails != null && !responseDetails.isBlank()) ? ": " + responseDetails : "";
            throw new TranslationProviderException("Empty or blank translation returned by MyMemory for langpair=" + langPair + details);
        }

        return translatedText.trim();
    }

    private boolean isQuotaWarning(String s) {
        if (s == null) {
            return false;
        }
        String upper = s.toUpperCase(Locale.ROOT);
        return upper.contains("MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS")
                || upper.contains("QUOTA_EXCEEDED")
                || upper.contains("QUOTA FINISHED")
                || upper.contains("DAILY LIMIT REACHED");
    }

    private boolean isProviderWarning(String s) {
        if (s == null) {
            return false;
        }
        String upper = s.toUpperCase(Locale.ROOT);
        return upper.startsWith("MYMEMORY WARNING:")
                || upper.startsWith("INVALID LANGUAGE")
                || upper.startsWith("PLEASE SELECT TWO DISTINCT");
    }

    private void validateLanguages(String sourceLang, String targetLang) {
        if (sourceLang == null || sourceLang.isBlank()) {
            throw new IllegalArgumentException("sourceLang cannot be null or blank");
        }
        if (targetLang == null || targetLang.isBlank()) {
            throw new IllegalArgumentException("targetLang cannot be null or blank");
        }
        if (sourceLang.trim().equalsIgnoreCase(targetLang.trim())) {
            throw new IllegalArgumentException("Target language cannot be identical to source language: " + sourceLang);
        }
    }
}
