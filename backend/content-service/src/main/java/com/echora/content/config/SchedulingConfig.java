package com.echora.content.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "echora.publish-retry.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingConfig {
}
