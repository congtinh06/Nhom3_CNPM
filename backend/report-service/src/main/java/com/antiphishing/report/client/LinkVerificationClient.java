package com.antiphishing.report.client;

import com.antiphishing.report.dto.VerifyRequest;
import com.antiphishing.report.dto.VerifyResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "link-verification-service",
        url = "${services.link-verification.url}",
        configuration = FeignClientConfig.class
)
public interface LinkVerificationClient {

    @PostMapping("/api/v1/verify")
    VerifyResponse verify(@RequestBody VerifyRequest request);
}
