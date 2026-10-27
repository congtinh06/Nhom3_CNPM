package com.echora.order.service;

import com.echora.order.entity.Order;
import com.echora.order.exception.EntitlementGrantException;
import com.echora.order.exception.ServiceUnavailableException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
public class AuthEntitlementClient {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private final RestClient restClient;
    private final String internalApiKey;
    private final int accessDays;

    public AuthEntitlementClient(@Value("${app.auth-service.url:http://localhost:8086}") String baseUrl,
                                 @Value("${internal.api-key:}") String internalApiKey,
                                 @Value("${app.premium.access-days:365}") int accessDays) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(5000);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.internalApiKey = internalApiKey;
        this.accessDays = Math.max(1, accessDays);
    }

    /**
     * Read-only entitlement check used for pricing. A temporary auth-service
     * failure must not block checkout, so any lookup error degrades to FREE.
     */
    public boolean isPremiumActive(Long userId) {
        if (userId == null) {
            return false;
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("Premium entitlement lookup skipped: internal API key is not configured.");
            return false;
        }

        try {
            EntitlementSnapshot response = restClient.get()
                    .uri("/api/auth/internal/entitlements/{userId}", userId)
                    .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                    .retrieve()
                    .body(EntitlementSnapshot.class);
            return response != null && Boolean.TRUE.equals(response.premiumActive());
        } catch (RestClientException ex) {
            log.warn("Could not read Premium entitlement for userId={}: {}", userId, ex.getMessage());
            return false;
        }
    }

    public void activatePremium(Order order) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ServiceUnavailableException("Dịch vụ tài khoản chưa được cấu hình.");
        }

        LocalDateTime base = entitlementBaseTime(order);
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
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new EntitlementGrantException(
                        "Không thể kích hoạt Premium: " + ex.getStatusCode().value());
            }
            throw new ServiceUnavailableException(
                    "Không thể kích hoạt Premium cho tài khoản. Vui lòng thử lại sau.");
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException(
                    "Không thể kích hoạt Premium cho tài khoản. Vui lòng thử lại sau.");
        }
    }

    /** Cấp quyền ngoại ngữ cho một POI mua lẻ (idempotent theo mã đơn hàng). */
    public void grantPoiAccess(Order order) {
        if (order.getPoiId() == null) {
            return;
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ServiceUnavailableException("Dịch vụ tài khoản chưa được cấu hình.");
        }

        LocalDateTime base = entitlementBaseTime(order);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderCode", order.getOrderCode());
        body.put("expiresAt", base.plusDays(accessDays));

        try {
            restClient.post()
                    .uri("/api/auth/internal/entitlements/{userId}/pois/{poiId}/grant",
                            order.getUserId(), order.getPoiId())
                    .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new EntitlementGrantException(
                        "Không thể mở khóa điểm thuyết minh: " + ex.getStatusCode().value());
            }
            throw new ServiceUnavailableException(
                    "Không thể mở khóa điểm thuyết minh. Vui lòng thử lại sau.");
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException(
                    "Không thể mở khóa điểm thuyết minh. Vui lòng thử lại sau.");
        }
    }

    private static LocalDateTime entitlementBaseTime(Order order) {
        if (order.getPaidAt() != null) {
            return order.getPaidAt();
        }
        return order.getCreatedAt() == null ? LocalDateTime.now() : order.getCreatedAt();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EntitlementSnapshot(Boolean premiumActive) {
    }
}
