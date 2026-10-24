package com.echora.analytics.client;

import com.echora.analytics.dto.ContentPoiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(
        name = "content-service",
        url = "${services.content-service.url:http://localhost:8085}",
        configuration = FeignConfig.class
)
public interface ContentServiceClient {

    @GetMapping("/api/content/pois/{id}")
    ContentPoiResponse getPoiById(
            @PathVariable("id") Long id,
            @RequestParam(value = "lang", defaultValue = "vi") String lang
    );
}
