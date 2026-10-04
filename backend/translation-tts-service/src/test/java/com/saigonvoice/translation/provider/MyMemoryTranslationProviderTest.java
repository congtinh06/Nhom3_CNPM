package com.saigonvoice.translation.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.translation.exception.TranslationProviderException;
import com.saigonvoice.translation.exception.TranslationQuotaExceededException;
import com.saigonvoice.translation.exception.TranslationTimeoutException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class MyMemoryTranslationProviderTest {

    private static final String BASE_URL = "https://api.mymemory.translated.net";
    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder().baseUrl(BASE_URL);
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        objectMapper = new ObjectMapper();
    }

    private MyMemoryTranslationProvider createProvider(String email, int maxChunkBytes) {
        RestClient restClient = restClientBuilder.build();
        return new MyMemoryTranslationProvider(restClient, objectMapper, BASE_URL, email, maxChunkBytes);
    }

    @Test
    @DisplayName("translate() success: valid HTTP 200 with translation")
    void testTranslate_success() {
        MyMemoryTranslationProvider provider = createProvider("tester@example.com", 450);

        String jsonResponse = """
                {
                  "responseData": {
                    "translatedText": "Central Post Office",
                    "match": 1.0
                  },
                  "quotaFinished": false,
                  "responseDetails": "",
                  "responseStatus": 200
                }
                """;

        mockServer.expect(requestTo(containsString("/get?q=B%C6%B0u%20%C4%91i%E1%BB%87n%20Trung%20t%C3%A2m&langpair=vi%7Cen&de=tester@example.com")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TranslatedText result = provider.translate("Bưu điện Trung tâm", "vi", "en");

        assertNotNull(result);
        assertEquals("Central Post Office", result.text());
        assertTrue(provider.cacheable());
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() HTTP 200 with error body: maps to TranslationProviderException")
    void testTranslate_http200_errorBody_throwsProviderException() {
        MyMemoryTranslationProvider provider = createProvider(null, 450);

        String jsonResponse = """
                {
                  "responseData": null,
                  "quotaFinished": false,
                  "responseDetails": "INVALID TARGET LANGUAGE",
                  "responseStatus": 403
                }
                """;

        mockServer.expect(requestTo(containsString("/get")))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate("Nhà thờ", "vi", "invalid")
        );

        assertTrue(ex.getMessage().contains("403") || ex.getMessage().contains("INVALID TARGET LANGUAGE"));
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() quota body with quotaFinished=true: maps to TranslationQuotaExceededException")
    void testTranslate_quotaBody_quotaFinishedTrue_throwsQuotaExceededException() {
        MyMemoryTranslationProvider provider = createProvider(null, 450);

        String jsonResponse = """
                {
                  "responseData": {
                    "translatedText": "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY."
                  },
                  "quotaFinished": true,
                  "responseDetails": "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.",
                  "responseStatus": 200
                }
                """;

        mockServer.expect(requestTo(containsString("/get")))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TranslationQuotaExceededException ex = assertThrows(
                TranslationQuotaExceededException.class,
                () -> provider.translate("Nhà thờ Đức Bà", "vi", "en")
        );

        assertTrue(ex.getMessage().contains("MYMEMORY WARNING") || ex.getMessage().contains("quota"));
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() HTTP 429 quota exhausted: maps to TranslationQuotaExceededException")
    void testTranslate_http429_throwsQuotaExceededException() {
        MyMemoryTranslationProvider provider = createProvider(null, 450);

        mockServer.expect(requestTo(containsString("/get")))
                .andRespond(withRawStatus(429).body("DAILY LIMIT REACHED").contentType(MediaType.TEXT_PLAIN));

        assertThrows(
                TranslationQuotaExceededException.class,
                () -> provider.translate("Nhà thờ Đức Bà", "vi", "en")
        );
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() timeout: maps to TranslationTimeoutException (distinct from provider exception)")
    void testTranslate_timeout_throwsTimeoutException() {
        MyMemoryTranslationProvider provider = createProvider(null, 450);

        mockServer.expect(requestTo(containsString("/get")))
                .andRespond(request -> {
                    throw new SocketTimeoutException("Read timed out");
                });

        TranslationTimeoutException ex = assertThrows(
                TranslationTimeoutException.class,
                () -> provider.translate("Nhà thờ Đức Bà", "vi", "en")
        );

        assertTrue(ex.getMessage().contains("timeout"));
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() empty or blank translation result: rejected as TranslationProviderException")
    void testTranslate_emptyTranslation_throwsProviderException() {
        MyMemoryTranslationProvider provider = createProvider(null, 450);

        String jsonResponse = """
                {
                  "responseData": {
                    "translatedText": "   "
                  },
                  "quotaFinished": false,
                  "responseDetails": "",
                  "responseStatus": 200
                }
                """;

        mockServer.expect(requestTo(containsString("/get")))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate("Chợ", "vi", "en")
        );

        assertTrue(ex.getMessage().contains("Empty or blank translation"));
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() chunking correctness: reassembled text keeps exact chunk order")
    void testTranslate_chunkingCorrectness_reassembledKeepsOrder() {
        // Set maxChunkBytes small (e.g. 50 bytes) to force multi-chunk splitting
        MyMemoryTranslationProvider provider = createProvider(null, 50);

        String longSource = "Câu thứ nhất dài vừa. Câu thứ hai nối tiếp. Câu thứ ba kết thúc.";

        // Expect 3 GET requests in sequential order
        mockServer.expect(requestTo(containsString("/get?q=C%C3%A2u%20th%E1%BB%A9%20nh%E1%BA%A5t%20d%C3%A0i%20v%E1%BB%ABa.")))
                .andRespond(withSuccess("""
                        {
                          "responseData": {"translatedText": "First sentence of moderate length."},
                          "responseStatus": 200
                        }
                        """, MediaType.APPLICATION_JSON));

        mockServer.expect(requestTo(containsString("/get?q=C%C3%A2u%20th%E1%BB%A9%20hai%20n%E1%BB%91i%20ti%E1%BA%BFp.")))
                .andRespond(withSuccess("""
                        {
                          "responseData": {"translatedText": "Second sentence continues."},
                          "responseStatus": 200
                        }
                        """, MediaType.APPLICATION_JSON));

        mockServer.expect(requestTo(containsString("/get?q=C%C3%A2u%20th%E1%BB%A9%20ba%20k%E1%BA%BFt%20th%C3%BAc.")))
                .andRespond(withSuccess("""
                        {
                          "responseData": {"translatedText": "Third sentence concludes."},
                          "responseStatus": 200
                        }
                        """, MediaType.APPLICATION_JSON));

        TranslatedText result = provider.translate(longSource, "vi", "en");

        assertEquals(
                "First sentence of moderate length. Second sentence continues. Third sentence concludes.",
                result.text()
        );
        mockServer.verify();
    }

    @Test
    @DisplayName("translate() rejects identical source and target languages")
    void testTranslate_sameLanguage_throwsException() {
        MyMemoryTranslationProvider provider = createProvider(null, 450);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> provider.translate("Xin chào", "vi", "vi")
        );
        assertTrue(ex.getMessage().contains("identical"));
    }
}
