package com.antiphishing.linkverification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
public class PhishTankClient {

    private final RestTemplate restTemplate;

    @Value("${phishtank.app-key:}")
    private String appKey;

    @Value("${phishtank.endpoint:https://checkurl.phishtank.com/checkurl/}")
    private String endpoint;

    public PhishTankClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isFlagged(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("User-Agent", "antiphishing-brand-protection/1.0");

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("url", url);
            map.add("format", "json");
            if (appKey != null && !appKey.trim().isEmpty()) {
                map.add("app_key", appKey);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            Map<?, ?> response = restTemplate.postForObject(endpoint, request, Map.class);

            if (response != null && response.containsKey("results")) {
                Object resultsObj = response.get("results");
                if (resultsObj instanceof Map<?, ?> resultsMap) {
                    Object inDb = resultsMap.get("in_database");
                    Object valid = resultsMap.get("valid");
                    if (Boolean.TRUE.equals(inDb) && Boolean.TRUE.equals(valid)) {
                        log.info("PhishTank xác nhận URL nằm trong CSDL phishing: {}", url);
                        return true;
                    }
                }
            }

            return false;
        } catch (RestClientException e) {
            log.warn("PhishTank API lỗi hoặc bị giới hạn (HTTP 509/timeout): {}. Bỏ qua.", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra PhishTank: {}", e.getMessage());
            return false;
        }
    }
}
