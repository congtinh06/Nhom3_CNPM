package com.echora.order.service;

import com.echora.order.dto.ProductPrice;
import com.echora.order.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ProductPriceClientFailClosedTest {

    private ContentProductPriceRestClient restClient;
    private ProductPriceClient client;

    @BeforeEach
    void setUp() {
        restClient = mock(ContentProductPriceRestClient.class);
        client = new ProductPriceClient(restClient, "internal-secret");
    }

    @Test
    @DisplayName("dead content-service returns 503 before any order is created")
    void deadUpstreamFailsClosed() {
        when(restClient.fetchPrices(List.of(1L)))
                .thenThrow(new ResourceAccessException("connection refused"));

        assertThatThrownBy(() -> client.fetchPrices(List.of(1L)))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("open circuit returns 503")
    void openCircuitFailsClosed() {
        when(restClient.fetchPrices(List.of(1L)))
                .thenThrow(CallNotPermittedException.createCallNotPermittedException(
                        CircuitBreaker.ofDefaults("orderContentProductPrice")));

        assertThatThrownBy(() -> client.fetchPrices(List.of(1L)))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("missing internal key returns 503 without calling content-service")
    void missingKeyFailsClosed() {
        ProductPriceClient unconfigured = new ProductPriceClient(restClient, "");

        assertThatThrownBy(() -> unconfigured.fetchPrices(List.of(1L)))
                .isInstanceOf(ServiceUnavailableException.class);
        verifyNoInteractions(restClient);
    }

    @Test
    @DisplayName("valid response is mapped by product id")
    void validResponseIsMapped() {
        ProductPrice price = new ProductPrice();
        price.setId(1L);
        price.setPrice(java.math.BigDecimal.TEN);
        price.setIsActive(true);
        when(restClient.fetchPrices(List.of(1L))).thenReturn(List.of(price));

        Map<Long, ProductPrice> result = client.fetchPrices(List.of(1L));

        assertThat(result).containsEntry(1L, price);
    }
}
