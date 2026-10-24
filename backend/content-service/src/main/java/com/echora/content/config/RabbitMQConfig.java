package com.echora.content.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.amqp.RabbitProperties;
import org.springframework.boot.autoconfigure.amqp.RabbitRetryTemplateCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.policy.SimpleRetryPolicy;

import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.amqp.RabbitTemplateCustomizer;

/**
 * Topology RabbitMQ của content-service.
 *
 * echora.topic (topic)
 *   poi.created / poi.updated      -> (queue do translation-tts-service khai báo)
 *   poi.audio.ready  -> poi.audio.ready.queue   --(reject)--> echora.dlx -> poi.audio.ready.dlq
 *   poi.audio.failed -> poi.audio.failed.queue  --(reject)--> echora.dlx -> poi.audio.failed.dlq
 *
 * RabbitTemplate và listener container factory do Spring Boot tự cấu hình
 * (lấy MessageConverter bean bên dưới, publisher confirms/returns, retry từ application.yml).
 */
@Configuration
@Slf4j
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "echora.topic";
    public static final String DLX_NAME = "echora.dlx";

    public static final String ROUTING_KEY_POI_CREATED = "poi.created";
    public static final String ROUTING_KEY_POI_UPDATED = "poi.updated";

    public static final String ROUTING_KEY_POI_AUDIO_READY = "poi.audio.ready";
    public static final String ROUTING_KEY_POI_AUDIO_FAILED = "poi.audio.failed";

    public static final String QUEUE_POI_CREATED = "poi.created.queue";
    public static final String QUEUE_POI_UPDATED = "poi.updated.queue";

    public static final String QUEUE_POI_AUDIO_READY = "poi.audio.ready.queue";
    public static final String QUEUE_POI_AUDIO_FAILED = "poi.audio.failed.queue";

    public static final String DLQ_POI_CREATED = "poi.created.dlq";
    public static final String DLQ_POI_UPDATED = "poi.updated.dlq";

    public static final String DLQ_POI_AUDIO_READY = "poi.audio.ready.dlq";
    public static final String DLQ_POI_AUDIO_FAILED = "poi.audio.failed.dlq";

    // ---------- Exchanges ----------
    @Bean
    public TopicExchange echoraTopicExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public DirectExchange echoraDeadLetterExchange() {
        return new DirectExchange(DLX_NAME, true, false);
    }

    // ---------- Main queues (có x-dead-letter-exchange) ----------
    @Bean
    public Queue poiCreatedQueue() {
        return QueueBuilder.durable(QUEUE_POI_CREATED)
                .deadLetterExchange(DLX_NAME)
                .deadLetterRoutingKey(DLQ_POI_CREATED)
                .build();
    }

    @Bean
    public Queue poiUpdatedQueue() {
        return QueueBuilder.durable(QUEUE_POI_UPDATED)
                .deadLetterExchange(DLX_NAME)
                .deadLetterRoutingKey(DLQ_POI_UPDATED)
                .build();
    }

    @Bean
    public Binding bindingPoiCreated() {
        return BindingBuilder.bind(poiCreatedQueue()).to(echoraTopicExchange()).with(ROUTING_KEY_POI_CREATED);
    }

    @Bean
    public Binding bindingPoiUpdated() {
        return BindingBuilder.bind(poiUpdatedQueue()).to(echoraTopicExchange()).with(ROUTING_KEY_POI_UPDATED);
    }

    @Bean
    public Queue poiAudioReadyQueue() {
        return QueueBuilder.durable(QUEUE_POI_AUDIO_READY)
                .deadLetterExchange(DLX_NAME)
                .deadLetterRoutingKey(DLQ_POI_AUDIO_READY)
                .build();
    }

    @Bean
    public Queue poiAudioFailedQueue() {
        return QueueBuilder.durable(QUEUE_POI_AUDIO_FAILED)
                .deadLetterExchange(DLX_NAME)
                .deadLetterRoutingKey(DLQ_POI_AUDIO_FAILED)
                .build();
    }

    @Bean
    public Binding bindingPoiAudioReady() {
        return BindingBuilder.bind(poiAudioReadyQueue()).to(echoraTopicExchange()).with(ROUTING_KEY_POI_AUDIO_READY);
    }

    @Bean
    public Binding bindingPoiAudioFailed() {
        return BindingBuilder.bind(poiAudioFailedQueue()).to(echoraTopicExchange()).with(ROUTING_KEY_POI_AUDIO_FAILED);
    }

    // ---------- Dead letter queues ----------
    @Bean
    public Queue poiCreatedDlq() {
        return QueueBuilder.durable(DLQ_POI_CREATED).build();
    }

    @Bean
    public Queue poiUpdatedDlq() {
        return QueueBuilder.durable(DLQ_POI_UPDATED).build();
    }

    @Bean
    public Binding bindingPoiCreatedDlq() {
        return BindingBuilder.bind(poiCreatedDlq()).to(echoraDeadLetterExchange()).with(DLQ_POI_CREATED);
    }

    @Bean
    public Binding bindingPoiUpdatedDlq() {
        return BindingBuilder.bind(poiUpdatedDlq()).to(echoraDeadLetterExchange()).with(DLQ_POI_UPDATED);
    }

    @Bean
    public Queue poiAudioReadyDlq() {
        return QueueBuilder.durable(DLQ_POI_AUDIO_READY).build();
    }

    @Bean
    public Queue poiAudioFailedDlq() {
        return QueueBuilder.durable(DLQ_POI_AUDIO_FAILED).build();
    }

    @Bean
    public Binding bindingPoiAudioReadyDlq() {
        return BindingBuilder.bind(poiAudioReadyDlq()).to(echoraDeadLetterExchange()).with(DLQ_POI_AUDIO_READY);
    }

    @Bean
    public Binding bindingPoiAudioFailedDlq() {
        return BindingBuilder.bind(poiAudioFailedDlq()).to(echoraDeadLetterExchange()).with(DLQ_POI_AUDIO_FAILED);
    }

    // ---------- Converter ----------
    /**
     * Kiểu đích lấy từ tham số của @RabbitListener (TypePrecedence.INFERRED),
     * KHÔNG phụ thuộc header __TypeId__ của bên gửi (class bên gửi nằm package khác).
     * Header __TypeId__ chỉ được dùng khi không suy ra được kiểu, và chỉ tin package event của service này.
     */
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        typeMapper.setTrustedPackages("com.echora.content.event");
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    // ---------- Publisher returns ----------
    /** Message không route được (mandatory=true): log lại; PoiEventPublisher cũng đọc CorrelationData.getReturned(). */
    @Bean
    public RabbitTemplateCustomizer returnsLoggingCustomizer() {
        return template -> template.setReturnsCallback(returned -> log.warn(
                "Message returned by broker: exchange={}, routingKey={}, reply={} {}",
                returned.getExchange(), returned.getRoutingKey(), returned.getReplyCode(), returned.getReplyText()));
    }

    // ---------- Retry ----------
    /**
     * Giữ max-attempts từ spring.rabbitmq.listener.simple.retry, nhưng KHÔNG retry lỗi chắc chắn lặp lại
     * (payload hỏng / thiếu trường): đẩy thẳng sang DLQ. Lỗi khác (DB, POI chưa có...) retry rồi mới sang DLQ.
     */
    @Bean
    public RabbitRetryTemplateCustomizer listenerRetryCustomizer(RabbitProperties rabbitProperties) {
        int maxAttempts = rabbitProperties.getListener().getSimple().getRetry().getMaxAttempts();
        return (target, retryTemplate) -> {
            if (target == RabbitRetryTemplateCustomizer.Target.LISTENER) {
                Map<Class<? extends Throwable>, Boolean> retryable = Map.of(
                        MessageConversionException.class, false,
                        AmqpRejectAndDontRequeueException.class, false
                );
                retryTemplate.setRetryPolicy(new SimpleRetryPolicy(maxAttempts, retryable, true, true));
            }
        };
    }
}
