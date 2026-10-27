package com.echora.order.service;

import com.echora.order.dto.PoiPremiumPrice;
import com.echora.order.exception.BadRequestException;
import com.echora.order.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpStatusCodeException;

@Service
public class PoiPriceClient {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private final RestClient restClient;
    private final String internalApiKey;

    public PoiPriceClient(@Value("${app.content-service.url:http://localhost:8085}") String baseUrl,
                          @Value("${internal.api-key:}") String internalApiKey) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.internalApiKey = internalApiKey;
    }

    /**
     * Nạp giá mua lẻ Premium của một POI. premiumPrice null -> caller dùng giá mặc định.
     */
    public PoiPremiumPrice fetchPoiPrice(Long poiId) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ServiceUnavailableException("Dịch vụ nội dung chưa được cấu hình.");
        }
        try {
            PoiPremiumPrice price = restClient.get()
                    .uri("/api/content/internal/pois/{id}/premium-price", poiId)
                    .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                    .retrieve()
                    .body(PoiPremiumPrice.class);
            if (price == null || price.getPoiId() == null) {
                throw new BadRequestException("Điểm thuyết minh không tồn tại.");
            }
            return price;
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new BadRequestException("Điểm thuyết minh không tồn tại.");
            }
            throw new ServiceUnavailableException("Không thể kiểm tra giá điểm thuyết minh. Vui lòng thử lại sau.");
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException("Không thể kiểm tra giá điểm thuyết minh. Vui lòng thử lại sau.");
        }
    }
}
