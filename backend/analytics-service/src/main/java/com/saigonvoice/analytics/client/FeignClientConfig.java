package com.saigonvoice.analytics.client;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
