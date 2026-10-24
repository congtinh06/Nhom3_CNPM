package com.echora.order.service;

import com.echora.order.dto.ProductPrice;
import com.echora.order.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductPriceClient {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private final RestClient restClient;
    private final String internalApiKey;

    public ProductPriceClient(@Value("${app.content-service.url:http://localhost:8085}") String baseUrl,
                              @Value("${internal.api-key:}") String internalApiKey) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.internalApiKey = internalApiKey;
    }

    public Map<Long, ProductPrice> fetchPrices(Collection<Long> productIds) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ServiceUnavailableException("Dịch vụ sản phẩm chưa được cấu hình.");
        }

        try {
            List<ProductPrice> prices = restClient.post()
                    .uri("/api/content/internal/products/prices")
                    .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("productIds", productIds))
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<ProductPrice>>() {
                    });

            Map<Long, ProductPrice> result = new HashMap<>();
            if (prices != null) {
                for (ProductPrice price : prices) {
                    if (price != null && price.getId() != null) {
                        result.put(price.getId(), price);
                    }
                }
            }
            return result;
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException("Không thể kiểm tra giá sản phẩm. Vui lòng thử lại sau.");
        }
    }
}
