package com.echora.analytics.config;

import com.echora.analytics.client.ContentServiceClient;
import com.echora.analytics.consumer.AnalyticsEventListener;
import com.echora.analytics.controller.AnalyticsEventController;
import com.echora.analytics.controller.AnalyticsSummaryController;
import com.echora.analytics.repository.AnalyticsEventRepository;
import com.echora.analytics.service.AnalyticsEventService;
import com.echora.analytics.service.AnalyticsEventServiceImpl;
import com.echora.analytics.service.AnalyticsSummaryService;
import com.echora.analytics.service.AnalyticsSummaryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AnalyticsWiringTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
            .withUserConfiguration(
                    RabbitMQConfig.class,
                    AnalyticsEventServiceImpl.class,
                    AnalyticsSummaryServiceImpl.class,
                    AnalyticsEventListener.class,
                    AnalyticsEventController.class,
                    AnalyticsSummaryController.class
            )
            .withBean(AnalyticsEventRepository.class, () -> mock(AnalyticsEventRepository.class))
            .withBean(ContentServiceClient.class, () -> mock(ContentServiceClient.class))
            .withBean(RabbitTemplate.class, () -> mock(RabbitTemplate.class));

    @Test
    @DisplayName("Loads real application wiring for analytics beans without DB and RabbitMQ broker")
    void testAnalyticsBeanGraphWiring_withoutDbAndRabbit() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();

            // Services
            assertThat(context).hasSingleBean(AnalyticsEventService.class);
            assertThat(context).hasSingleBean(AnalyticsSummaryService.class);

            // Consumer
            assertThat(context).hasSingleBean(AnalyticsEventListener.class);

            // Controllers
            assertThat(context).hasSingleBean(AnalyticsEventController.class);
            assertThat(context).hasSingleBean(AnalyticsSummaryController.class);

            // RabbitMQ Topology
            assertThat(context).hasBean("analyticsTopicExchange");
            assertThat(context.getBean("analyticsTopicExchange")).isInstanceOf(TopicExchange.class);
            assertThat(context).hasBean("analyticsDeadLetterExchange");
            assertThat(context.getBean("analyticsDeadLetterExchange")).isInstanceOf(DirectExchange.class);
            assertThat(context).hasBean("analyticsEventQueue");
            assertThat(context.getBean("analyticsEventQueue")).isInstanceOf(Queue.class);
            assertThat(context).hasBean("analyticsEventDlq");
            assertThat(context.getBean("analyticsEventDlq")).isInstanceOf(Queue.class);
        });
    }
}
