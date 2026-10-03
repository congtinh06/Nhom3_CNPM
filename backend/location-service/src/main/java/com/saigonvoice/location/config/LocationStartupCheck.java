package com.saigonvoice.location.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LocationStartupCheck {

    private static final Logger log = LoggerFactory.getLogger(LocationStartupCheck.class);

    @Value("${internal.api-key:}")
    private String internalApiKey;

    @PostConstruct
    public void validateConfiguration() {
        if (internalApiKey == null || internalApiKey.trim().isEmpty()) {
            log.warn("INTERNAL_API_KEY is not configured or empty. Outgoing calls to content-service will fail authentication.");
        }
    }
}
