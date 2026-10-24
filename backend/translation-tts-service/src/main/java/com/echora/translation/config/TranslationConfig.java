package com.echora.translation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.echora.translation.provider.MyMemoryTranslationProvider;
import com.echora.translation.provider.SeedTranslationProvider;
import com.echora.translation.provider.TranslationProvider;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;

@Configuration
public class TranslationConfig {

    @Bean
    @ConditionalOnMissingBean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    @Primary
    public TranslationProvider translationProvider(
            @Value("${app.translation.provider:}") String providerName,
            ObjectProvider<SeedTranslationProvider> seedProvider,
            ObjectProvider<MyMemoryTranslationProvider> myMemoryProvider
    ) {
        if (providerName == null || providerName.isBlank()) {
            throw new IllegalArgumentException(
                    "Unknown app.translation.provider: '" + (providerName == null ? "" : providerName) + "'. Supported values are 'seed' and 'mymemory'."
            );
        }
        String clean = providerName.trim();
        if (SeedTranslationProvider.PROVIDER_NAME.equalsIgnoreCase(clean)) {
            SeedTranslationProvider provider = seedProvider.getIfAvailable();
            if (provider == null) {
                return new SeedTranslationProvider();
            }
            return provider;
        } else if (MyMemoryTranslationProvider.PROVIDER_NAME.equalsIgnoreCase(clean)) {
            MyMemoryTranslationProvider provider = myMemoryProvider.getIfAvailable();
            if (provider == null) {
                throw new IllegalStateException("MyMemoryTranslationProvider bean not available");
            }
            return provider;
        } else {
            throw new IllegalArgumentException(
                    "Unknown app.translation.provider: '" + providerName + "'. Supported values are 'seed' and 'mymemory'."
            );
        }
    }
}
