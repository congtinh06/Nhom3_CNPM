package com.antiphishing.notification.client;

import com.antiphishing.notification.dto.NarrationRequest;
import com.antiphishing.notification.dto.NarrationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "narration-service", url = "${narration.service.url}")
public interface NarrationClient {

    @PostMapping("/api/v1/narrate")
    NarrationResponse narrate(@RequestBody NarrationRequest request);
}
