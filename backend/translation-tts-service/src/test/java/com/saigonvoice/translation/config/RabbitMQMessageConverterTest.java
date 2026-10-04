package com.saigonvoice.translation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.translation.event.PoiEventPayload;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.support.converter.MessageConverter;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class RabbitMQMessageConverterTest {

    @Test
    @DisplayName("Converts Message with unknown field, foreign __TypeId__, and preserves spaces and \\r\\n")
    void testMessageConverter_inferredType_preservesFormattingAndIgnoresUnknown() {
        RabbitMQConfig rabbitMQConfig = new RabbitMQConfig();
        MessageConverter converter = rabbitMQConfig.jsonMessageConverter(new ObjectMapper());

        String json = """
                {
                  "poiId": 101,
                  "poiCode": "POI_01",
                  "zoneId": 1,
                  "sourceLanguage": "vi",
                  "title": "  Dinh  Độc  Lập  ",
                  "summary": "Di tích  lịch sử\\r\\nquốc gia",
                  "description": "Tọa lạc tại   Quận 1, TP.HCM.\\r\\nĐịa chỉ  cụ thể.",
                  "historicalSignificance": "Ý nghĩa   lịch sử sâu sắc.",
                  "targetLanguages": ["en", "ja"],
                  "unknownExtraField": "unexpected_payload_field"
                }
                """;

        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        properties.setHeader("__TypeId__", "com.saigonvoice.content.event.SomeOtherClass");
        properties.setInferredArgumentType(PoiEventPayload.class);

        Message message = new Message(json.getBytes(StandardCharsets.UTF_8), properties);

        Object result = converter.fromMessage(message);

        assertNotNull(result);
        assertInstanceOf(PoiEventPayload.class, result);

        PoiEventPayload payload = (PoiEventPayload) result;
        assertEquals(101L, payload.getPoiId());
        assertEquals("POI_01", payload.getPoiCode());
        assertEquals(1L, payload.getZoneId());
        assertEquals("vi", payload.getSourceLanguage());

        // Assert spaces and \r\n are preserved exactly
        assertEquals("  Dinh  Độc  Lập  ", payload.getTitle());
        assertEquals("Di tích  lịch sử\r\nquốc gia", payload.getSummary());
        assertEquals("Tọa lạc tại   Quận 1, TP.HCM.\r\nĐịa chỉ  cụ thể.", payload.getDescription());
        assertEquals("Ý nghĩa   lịch sử sâu sắc.", payload.getHistoricalSignificance());

        // Assert target languages parsed
        assertEquals(2, payload.getTargetLanguages().size());
        assertEquals("en", payload.getTargetLanguages().get(0));
        assertEquals("ja", payload.getTargetLanguages().get(1));
    }
}
