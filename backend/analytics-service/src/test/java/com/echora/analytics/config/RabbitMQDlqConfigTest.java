package com.echora.analytics.config;

import com.echora.analytics.messaging.AnalyticsEventMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.support.converter.SmartMessageConverter;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.retry.support.RetryTemplate;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RabbitMQDlqConfigTest {

    private final RabbitMQConfig config = new RabbitMQConfig();
    private final MessageConverter converter = config.jsonMessageConverter(new ObjectMapper());

    @Test
    @DisplayName("Main queue dead-letters to the analytics DLX with the dlq routing key")
    void mainQueueDeclaresDeadLetterRoute() {
        Queue queue = config.analyticsEventQueue();

        assertThat(queue.getName()).isEqualTo(RabbitMQConfig.QUEUE_ANALYTICS_EVENT);
        assertThat(queue.getArguments())
                .containsEntry("x-dead-letter-exchange", RabbitMQConfig.DLX_NAME)
                .containsEntry("x-dead-letter-routing-key", RabbitMQConfig.ROUTING_KEY_ANALYTICS_EVENT_DLQ);
    }

    @Test
    @DisplayName("DLQ binding consumes the DLX with the dlq routing key")
    void dlqBindingTargetsDeadLetterExchange() {
        var binding = config.bindingAnalyticsEventDlq();

        assertThat(binding.getDestination()).isEqualTo(RabbitMQConfig.DLQ_ANALYTICS_EVENT);
        assertThat(binding.getExchange()).isEqualTo(RabbitMQConfig.DLX_NAME);
        assertThat(binding.getRoutingKey()).isEqualTo(RabbitMQConfig.ROUTING_KEY_ANALYTICS_EVENT_DLQ);
    }

    @Test
    @DisplayName("Truncated JSON fails conversion and is a non-retryable MessageConversionException")
    void truncatedJsonFailsConversion() {
        Message message = jsonMessage("{ \"eventId\": \"dlq-repro-1\", \"eventType\": \"SCAN\",");

        assertThrows(MessageConversionException.class,
                () -> ((SmartMessageConverter) converter)
                        .fromMessage(message, new ParameterizedTypeReference<AnalyticsEventMessage>() {
                        }));
    }

    @Test
    @DisplayName("Wrong field type fails conversion, matching the analytics.event.dlq reproduction")
    void wrongFieldTypeFailsConversion() {
        Message message = jsonMessage(
                "{\"eventId\":\"dlq-repro-2\",\"eventType\":\"SCAN\",\"poiId\":\"not-a-number\"}");

        assertThrows(MessageConversionException.class,
                () -> ((SmartMessageConverter) converter)
                        .fromMessage(message, new ParameterizedTypeReference<AnalyticsEventMessage>() {
                        }));
    }

    @Test
    @DisplayName("MessageConversionException is not retried, so the container rejects it straight to the DLQ")
    void conversionFailureIsNotRetried() {
        RetryTemplate retryTemplate = new RetryTemplate();
        config.listenerRetryCustomizer(3).customize(
                org.springframework.boot.autoconfigure.amqp.RabbitRetryTemplateCustomizer.Target.LISTENER,
                retryTemplate);

        AtomicInteger attempts = new AtomicInteger();

        assertThrows(MessageConversionException.class, () -> retryTemplate.execute(context -> {
            attempts.incrementAndGet();
            throw new MessageConversionException("Failed to convert Message content");
        }));

        assertThat(attempts).hasValue(1);
    }

    private static Message jsonMessage(String body) {
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        properties.setContentEncoding(StandardCharsets.UTF_8.name());
        return new Message(body.getBytes(StandardCharsets.UTF_8), properties);
    }
}
