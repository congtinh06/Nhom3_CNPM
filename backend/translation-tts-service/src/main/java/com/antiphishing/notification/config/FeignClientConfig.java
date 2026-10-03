package com.antiphishing.notification.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Adds the internal API key header to outgoing Feign calls, mirroring the
 * defense-in-depth convention already used by report-service.
 */
@Configuration
public class FeignClientConfig {

    @Value("${internal.api-key:}")
    private String internalApiKey;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            if (internalApiKey != null && !internalApiKey.trim().isEmpty()) {
                requestTemplate.header("X-Internal-Api-Key", internalApiKey);
            }
        };
    }
}
