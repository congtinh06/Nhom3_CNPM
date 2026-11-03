package com.echora.order.service;

import com.echora.order.dto.PoiPremiumPrice;
import com.echora.order.exception.BadRequestException;
import com.echora.order.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;

/**
 * Maps content-service POI price responses to order domain results.
 *
 * <p>Any upstream failure (dead service, 5xx, open circuit, timeout) becomes a 503. The caller
 * must never continue with a stale or default price when the real price is unknown.</p>
 */
@Service
public class PoiPriceClient {

    public static final String HEADER_INTERNAL_API_KEY = ContentPoiPriceRestClient.HEADER_INTERNAL_API_KEY;

    private final ContentPoiPriceRestClient restClient;
    private final String internalApiKey;

    public PoiPriceClient(ContentPoiPriceRestClient restClient,
                          @Value("${internal.api-key:}") String internalApiKey) {
        this.restClient = restClient;
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
            PoiPremiumPrice price = restClient.fetchPoiPrice(poiId);
            if (price == null || price.getPoiId() == null) {
                throw new BadRequestException("Điểm thuyết minh không tồn tại.");
            }
            return price;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                throw new BadRequestException("Điểm thuyết minh không tồn tại.");
            }
            throw new ServiceUnavailableException("Không thể kiểm tra giá điểm thuyết minh. Vui lòng thử lại sau.");
        } catch (CallNotPermittedException | RestClientException ex) {
            throw new ServiceUnavailableException("Không thể kiểm tra giá điểm thuyết minh. Vui lòng thử lại sau.");
        }
    }
}
