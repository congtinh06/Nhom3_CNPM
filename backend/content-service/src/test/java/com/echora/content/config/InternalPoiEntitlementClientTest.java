package com.echora.content.config;

import com.echora.content.exception.EntitlementServiceUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InternalPoiEntitlementClientTest {

    private AuthEntitlementRestClient authClient;
    private InternalPoiEntitlementClient client;

    @BeforeEach
    void setUp() {
        authClient = mock(AuthEntitlementRestClient.class);
        client = new InternalPoiEntitlementClient(authClient, "test-key");
    }

    @Test
    @DisplayName("successful purchased-POI response is cached")
    void purchasedPoiIdsCachesSuccess() {
        AuthEntitlementRestClient.PurchasedPoi poi = new AuthEntitlementRestClient.PurchasedPoi();
        poi.poiId = 42L;
        when(authClient.fetchPurchasedPois(7L)).thenReturn(new AuthEntitlementRestClient.PurchasedPoi[]{poi});

        assertThat(client.purchasedPoiIds(7L)).containsExactly(42L);
        assertThat(client.purchasedPoiIds(7L)).containsExactly(42L);

        verify(authClient, times(1)).fetchPurchasedPois(7L);
    }

    @Test
    @DisplayName("auth failure is rethrown and never cached as an empty entitlement list")
    void authFailureFailsClosedAndIsNotCached() {
        when(authClient.fetchPurchasedPois(8L))
                .thenThrow(new RuntimeException("auth down"));

        assertThatThrownBy(() -> client.purchasedPoiIds(8L))
                .isInstanceOf(EntitlementServiceUnavailableException.class);

        assertThatThrownBy(() -> client.purchasedPoiIds(8L))
                .isInstanceOf(EntitlementServiceUnavailableException.class);

        verify(authClient, times(2)).fetchPurchasedPois(8L);
    }

    @Test
    @DisplayName("single-POI entitlement check fails closed on auth failure")
    void hasPurchasedPoiFailsClosed() {
        when(authClient.fetchSnapshot(9L, 3L))
                .thenThrow(new RuntimeException("auth down"));

        assertThatThrownBy(() -> client.hasPurchasedPoi(9L, 3L))
                .isInstanceOf(EntitlementServiceUnavailableException.class);
    }

    @Test
    @DisplayName("single-POI entitlement success is returned")
    void hasPurchasedPoiReturnsSnapshot() {
        AuthEntitlementRestClient.EntitlementSnapshot snapshot =
                new AuthEntitlementRestClient.EntitlementSnapshot();
        snapshot.premiumActive = true;
        when(authClient.fetchSnapshot(9L, 3L)).thenReturn(snapshot);

        assertThat(client.hasPurchasedPoi(9L, 3L)).isTrue();
    }

    @Test
    @DisplayName("blank internal API key means no entitlement without calling auth-service")
    void blankApiKeyDoesNotCallAuth() {
        InternalPoiEntitlementClient noKeyClient = new InternalPoiEntitlementClient(authClient, "");

        assertThat(noKeyClient.purchasedPoiIds(1L)).isEmpty();
        assertThat(noKeyClient.hasPurchasedPoi(1L, 2L)).isFalse();
    }
}
