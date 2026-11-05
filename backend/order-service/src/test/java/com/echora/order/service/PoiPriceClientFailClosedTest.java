package com.echora.order.service;

import com.echora.order.dto.PoiPremiumPrice;
import com.echora.order.exception.BadRequestException;
import com.echora.order.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PoiPriceClientFailClosedTest {

    private ContentPoiPriceRestClient restClient;
    private PoiPriceClient client;

    @BeforeEach
    void setUp() {
        restClient = mock(ContentPoiPriceRestClient.class);
        client = new PoiPriceClient(restClient, "internal-secret");
    }

    @Test
    @DisplayName("dead content-service returns 503, never a default price")
    void deadUpstreamFailsClosed() {
        when(restClient.fetchPoiPrice(42L))
                .thenThrow(new ResourceAccessException("connection refused"));

        assertThatThrownBy(() -> client.fetchPoiPrice(42L))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("open circuit returns 503")
    void openCircuitFailsClosed() {
        when(restClient.fetchPoiPrice(42L))
                .thenThrow(CallNotPermittedException.createCallNotPermittedException(
                        io.github.resilience4j.circuitbreaker.CircuitBreaker.ofDefaults("orderContentPoiPrice")));

        assertThatThrownBy(() -> client.fetchPoiPrice(42L))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("4xx from content-service remains a 400")
    void clientErrorBecomesBadRequest() {
        when(restClient.fetchPoiPrice(42L))
                .thenThrow(new HttpClientErrorException(org.springframework.http.HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.fetchPoiPrice(42L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("empty payload is rejected instead of silently using a default price")
    void emptyPayloadIsRejected() {
        when(restClient.fetchPoiPrice(42L)).thenReturn(null);

        assertThatThrownBy(() -> client.fetchPoiPrice(42L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("missing internal key returns 503 without calling content-service")
    void missingKeyFailsClosed() {
        PoiPriceClient unconfigured = new PoiPriceClient(restClient, " ");

        assertThatThrownBy(() -> unconfigured.fetchPoiPrice(42L))
                .isInstanceOf(ServiceUnavailableException.class);
        verifyNoInteractions(restClient);
    }

    @Test
    @DisplayName("valid response is passed through")
    void validResponseIsPassedThrough() {
        PoiPremiumPrice price = new PoiPremiumPrice();
        price.setPoiId(42L);
        when(restClient.fetchPoiPrice(42L)).thenReturn(price);

        assertThat(client.fetchPoiPrice(42L)).isSameAs(price);
    }
}
