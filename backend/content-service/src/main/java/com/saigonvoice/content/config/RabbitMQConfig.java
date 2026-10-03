package com.saigonvoice.content.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "saigonvoice.topic";
    public static final String ROUTING_KEY_POI_CREATED = "poi.created";
    public static final String ROUTING_KEY_POI_UPDATED = "poi.updated";

    public static final String QUEUE_POI_AUDIO_READY = "poi.audio.ready.queue";
    public static final String ROUTING_KEY_POI_AUDIO = "poi.audio.*";

    @Bean
    public TopicExchange saigonVoiceTopicExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue poiAudioReadyQueue() {
        return QueueBuilder.durable(QUEUE_POI_AUDIO_READY).build();
    }

    @Bean
    public Binding bindingPoiAudioReady(Queue poiAudioReadyQueue, TopicExchange saigonVoiceTopicExchange) {
        return BindingBuilder.bind(poiAudioReadyQueue).to(saigonVoiceTopicExchange).with(ROUTING_KEY_POI_AUDIO);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
