package com.echora.order.service;

import com.echora.order.dto.ProductPrice;
import com.echora.order.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Maps content-service batch price responses to order domain results.
 *
 * <p>Failures become a 503 before any order is created. There is deliberately no fallback price:
 * charging the user with an invented price is worse than asking them to retry.</p>
 */
@Service
public class ProductPriceClient {

    public static final String HEADER_INTERNAL_API_KEY = ContentProductPriceRestClient.HEADER_INTERNAL_API_KEY;

    private final ContentProductPriceRestClient restClient;
    private final String internalApiKey;

    public ProductPriceClient(ContentProductPriceRestClient restClient,
                              @Value("${internal.api-key:}") String internalApiKey) {
        this.restClient = restClient;
        this.internalApiKey = internalApiKey;
    }

    public Map<Long, ProductPrice> fetchPrices(Collection<Long> productIds) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            throw new ServiceUnavailableException("Dịch vụ sản phẩm chưa được cấu hình.");
        }

        try {
            List<ProductPrice> prices = restClient.fetchPrices(productIds);

            Map<Long, ProductPrice> result = new HashMap<>();
            if (prices != null) {
                for (ProductPrice price : prices) {
                    if (price != null && price.getId() != null) {
                        result.put(price.getId(), price);
                    }
                }
            }
            return result;
        } catch (CallNotPermittedException | RestClientException ex) {
            throw new ServiceUnavailableException("Không thể kiểm tra giá sản phẩm. Vui lòng thử lại sau.");
        }
    }
}
