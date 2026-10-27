package com.echora.content.config;

import com.echora.content.entity.Poi;
import com.echora.content.repository.PoiRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Dùng chung cho EntitlementFilter: map qrToken -> poiId (luồng mua lẻ theo POI). */
@Configuration
public class PoiLookupConfig {

    @Bean
    public EntitlementFilter.PoiLookup poiLookup(PoiRepository poiRepository) {
        return qrToken -> poiRepository.findByQrToken(qrToken)
                .map(Poi::getId)
                .orElse(null);
    }
}
