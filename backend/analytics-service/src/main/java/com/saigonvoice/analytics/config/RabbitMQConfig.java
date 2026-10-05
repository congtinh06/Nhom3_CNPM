package com.saigonvoice.analytics.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.*;
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

    public static final String EXCHANGE_NAME = "saigonvoice.analytics";
    public static final String DLX_NAME = "saigonvoice.analytics.dlx";

    public static final String ROUTING_KEY_ANALYTICS_EVENT = "analytics.event";
    public static final String ROUTING_KEY_ANALYTICS_EVENT_DLQ = "analytics.event.dlq";

    public static final String QUEUE_ANALYTICS_EVENT = "analytics.event.queue";
    public static final String DLQ_ANALYTICS_EVENT = "analytics.event.dlq";

    @Bean
    public TopicExchange analyticsTopicExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public DirectExchange analyticsDeadLetterExchange() {
        return new DirectExchange(DLX_NAME, true, false);
    }

    @Bean
    public Queue analyticsEventQueue() {
        return QueueBuilder.durable(QUEUE_ANALYTICS_EVENT)
                .deadLetterExchange(DLX_NAME)
                .deadLetterRoutingKey(ROUTING_KEY_ANALYTICS_EVENT_DLQ)
                .build();
    }

    @Bean
    public Queue analyticsEventDlq() {
        return QueueBuilder.durable(DLQ_ANALYTICS_EVENT).build();
    }

    @Bean
    public Binding bindingAnalyticsEvent() {
        return BindingBuilder.bind(analyticsEventQueue())
                .to(analyticsTopicExchange())
                .with(ROUTING_KEY_ANALYTICS_EVENT);
    }

    @Bean
    public Binding bindingAnalyticsEventDlq() {
        return BindingBuilder.bind(analyticsEventDlq())
                .to(analyticsDeadLetterExchange())
                .with(ROUTING_KEY_ANALYTICS_EVENT_DLQ);
    }

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
    public RabbitRetryTemplateCustomizer listenerRetryCustomizer(
            @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.listener.simple.retry.max-attempts:3}") int maxAttempts) {
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
