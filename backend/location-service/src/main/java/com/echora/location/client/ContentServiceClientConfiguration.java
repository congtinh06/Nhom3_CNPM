package com.echora.location.client;

import feign.Request;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import feign.Retryer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class ContentServiceClientConfiguration {

    @Value("${internal.api-key:}")
    private String internalApiKey;

    @Value("${feign.content-service.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    @Value("${feign.content-service.read-timeout-ms:10000}")
    private int readTimeoutMs;

    @Bean
    public RequestInterceptor internalApiKeyRequestInterceptor() {
        return (RequestTemplate template) -> {
            if (internalApiKey != null && !internalApiKey.trim().isEmpty()) {
                template.header("X-Internal-Api-Key", internalApiKey);
            }
        };
    }

    @Bean
    public Request.Options requestOptions() {
        // D2-Fix Q2: timeout for internal content-service calls
        // connectTimeout: chờ kết nối TCP
        // readTimeout: chờ response (tối đa, tùy chỉnh qua application.yml)
        return new Request.Options(connectTimeoutMs, TimeUnit.MILLISECONDS, readTimeoutMs, TimeUnit.MILLISECONDS, true);
    }

    @Bean
    public Retryer retryer() {
        // No retry on failure as per requirement
        return Retryer.NEVER_RETRY;
    }
}
