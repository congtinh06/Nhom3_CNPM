package com.echora.order.service;

import com.echora.order.entity.Order;
import com.echora.order.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthEntitlementClient {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private final RestClient restClient;
    private final String internalApiKey;
    private final int accessDays;

    public AuthEntitlementClient(@Value("${app.auth-service.url:http://localhost:8086}") String baseUrl,
                                 @Value("${internal.api-key:}") String internalApiKey,
                                 @Value("${app.premium.access-days:365}") int accessDays) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.internalApiKey = internalApiKey;
        this.accessDays = Math.max(1, accessDays);
    }

    public void activatePremium(Order order) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ServiceUnavailableException("Dịch vụ tài khoản chưa được cấu hình.");
        }

        LocalDateTime base = order.getCreatedAt() == null ? LocalDateTime.now() : order.getCreatedAt();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderCode", order.getOrderCode());
        body.put("expiresAt", base.plusDays(accessDays));

        try {
            restClient.post()
                    .uri("/api/auth/internal/entitlements/{userId}/premium", order.getUserId())
                    .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException(
                    "Không thể kích hoạt Premium cho tài khoản. Vui lòng thử lại sau.");
        }
    }
}
