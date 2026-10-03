package com.saigonvoice.location.client;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import feign.Retryer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ContentServiceClientConfiguration {

    @Value("${internal.api-key:}")
    private String internalApiKey;

    @Bean
    public RequestInterceptor internalApiKeyRequestInterceptor() {
        return (RequestTemplate template) -> {
            if (internalApiKey != null && !internalApiKey.trim().isEmpty()) {
                template.header("X-Internal-Api-Key", internalApiKey);
            }
        };
    }

    @Bean
    public Retryer retryer() {
        // No retry on failure as per requirement
        return Retryer.NEVER_RETRY;
    }
}
