package com.saigonvoice.translation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.amqp.RabbitProperties;
import org.springframework.boot.autoconfigure.amqp.RabbitRetryTemplateCustomizer;
import org.springframework.boot.autoconfigure.amqp.RabbitTemplateCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.policy.SimpleRetryPolicy;

import java.util.Map;

@Configuration
@Slf4j
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "saigonvoice.topic";

    public static final String ROUTING_KEY_POI_CREATED = "poi.created";
    public static final String ROUTING_KEY_POI_UPDATED = "poi.updated";
    public static final String ROUTING_KEY_POI_AUDIO_READY = "poi.audio.ready";
    public static final String ROUTING_KEY_POI_AUDIO_FAILED = "poi.audio.failed";

    public static final String QUEUE_POI_CREATED = "poi.created.queue";
    public static final String QUEUE_POI_UPDATED = "poi.updated.queue";

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        typeMapper.setTrustedPackages("*");
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public RabbitTemplateCustomizer returnsLoggingCustomizer() {
        return template -> {
            template.setMandatory(true);
            template.setReturnsCallback(returned -> log.warn(
                    "Message returned by broker: exchange={}, routingKey={}, reply={} {}",
                    returned.getExchange(), returned.getRoutingKey(), returned.getReplyCode(), returned.getReplyText()));
        };
    }

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
