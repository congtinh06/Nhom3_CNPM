package com.saigonvoice.translation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.translation.provider.MyMemoryTranslationProvider;
import com.saigonvoice.translation.provider.SeedTranslationProvider;
import com.saigonvoice.translation.provider.TranslationProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;

@Configuration
public class TranslationConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    @Primary
    public TranslationProvider translationProvider(
            @Value("${app.translation.provider:seed}") String providerName,
            SeedTranslationProvider seedProvider,
            MyMemoryTranslationProvider myMemoryProvider
    ) {
        if (SeedTranslationProvider.PROVIDER_NAME.equalsIgnoreCase(providerName.trim())) {
            return seedProvider;
        } else if (MyMemoryTranslationProvider.PROVIDER_NAME.equalsIgnoreCase(providerName.trim())) {
            return myMemoryProvider;
        } else {
            throw new IllegalArgumentException(
                    "Unknown translation.provider: '" + providerName + "'. Supported values are 'seed' and 'mymemory'."
            );
        }
    }
}
