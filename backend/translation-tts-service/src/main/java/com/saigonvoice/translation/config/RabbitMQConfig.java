package com.saigonvoice.translation.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE = "report.created.queue";
    public static final String EXCHANGE = "report.exchange";
    public static final String ROUTING_KEY = "report.created";

    @Bean
    public Queue reportQueue() {
        return new Queue(QUEUE, true);
    }

    @Bean
    public TopicExchange reportExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Binding binding(Queue reportQueue, TopicExchange reportExchange) {
        return BindingBuilder.bind(reportQueue).to(reportExchange).with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
