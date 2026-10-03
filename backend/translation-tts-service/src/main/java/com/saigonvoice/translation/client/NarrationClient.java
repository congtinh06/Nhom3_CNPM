package com.saigonvoice.translation.client;

import com.saigonvoice.translation.dto.NarrationRequest;
import com.saigonvoice.translation.dto.NarrationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "content-service", url = "${content.service.url:http://localhost:8085}")
public interface NarrationClient {

    @PostMapping("/api/v1/narrate")
    NarrationResponse narrate(@RequestBody NarrationRequest request);
}
