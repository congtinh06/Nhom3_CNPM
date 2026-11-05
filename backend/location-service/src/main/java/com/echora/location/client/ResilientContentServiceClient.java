package com.echora.location.client;

import com.echora.location.dto.PoiBoundingBoxDto;
import com.echora.location.dto.PoiInternalQrDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Adapter around the Feign content-service client.
 *
 * <p>Resilience4j annotations intentionally live here instead of on the Feign interface or the
 * controller. All wrapped operations are idempotent GETs, so retry is safe. The default aspect
 * order keeps Retry outside CircuitBreaker: retries are attempted first and the breaker records
 * each physical attempt.</p>
 */
@Component
public class ResilientContentServiceClient {

    private final ContentServiceClient delegate;

    public ResilientContentServiceClient(ContentServiceClient delegate) {
        this.delegate = delegate;
    }

    @CircuitBreaker(name = "locationContentService")
    @Retry(name = "locationContentService")
    public List<PoiBoundingBoxDto> getPoisInBoundingBox(
            Long zoneId,
            BigDecimal minLat,
            BigDecimal maxLat,
            BigDecimal minLng,
            BigDecimal maxLng
    ) {
        return delegate.getPoisInBoundingBox(zoneId, minLat, maxLat, minLng, maxLng);
    }

    @CircuitBreaker(name = "locationContentService")
    @Retry(name = "locationContentService")
    public PoiInternalQrDto getPoiByQrToken(String qrToken) {
        return delegate.getPoiByQrToken(qrToken);
    }
}
