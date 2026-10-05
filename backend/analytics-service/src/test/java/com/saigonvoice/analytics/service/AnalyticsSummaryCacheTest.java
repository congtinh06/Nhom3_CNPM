package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.client.ContentServiceClient;
import com.saigonvoice.analytics.dto.AnalyticsSummaryResponse;
import com.saigonvoice.analytics.dto.ContentPoiResponse;
import com.saigonvoice.analytics.repository.AnalyticsEventRepository;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsSummaryCacheTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @Mock
    private ContentServiceClient contentServiceClient;

    private AnalyticsSummaryServiceImpl analyticsSummaryService;

    @BeforeEach
    void setUp() {
        analyticsSummaryService = new AnalyticsSummaryServiceImpl(
                analyticsEventRepository,
                contentServiceClient,
                300_000L, // 5 min TTL
                3000L      // 3s total budget
        );
    }

    @Test
    @DisplayName("POI name is cached in-memory and subsequent call hits cache without calling Feign again")
    void testPoiNameCaching_hitDoesNotCallFeign() {
        when(analyticsEventRepository.findTopPoisRaw(any(Pageable.class)))
                .thenReturn(Collections.singletonList(new Object[]{101L, 50L, 25L}));

        when(contentServiceClient.getPoiById(eq(101L), eq("vi")))
                .thenReturn(new ContentPoiResponse(101L, "Chợ Bến Thành"));

        // Call 1: Misses cache, calls Feign
        AnalyticsSummaryResponse summary1 = analyticsSummaryService.getSummary();
        assertThat(summary1.getTopPois().get(0).getName()).isEqualTo("Chợ Bến Thành");
        verify(contentServiceClient, times(1)).getPoiById(eq(101L), eq("vi"));

        // Call 2: Hits cache, does not call Feign
        AnalyticsSummaryResponse summary2 = analyticsSummaryService.getSummary();
        assertThat(summary2.getTopPois().get(0).getName()).isEqualTo("Chợ Bến Thành");
        verify(contentServiceClient, times(1)).getPoiById(eq(101L), eq("vi")); // still 1
    }

    @Test
    @DisplayName("Negative caching: failed Feign call caches null for TTL so dead content-service costs at most 1 timeout")
    void testNegativeCaching_deadContentServiceCostsAtMostOneTimeoutPerTtl() {
        when(analyticsEventRepository.findTopPoisRaw(any(Pageable.class)))
                .thenReturn(Collections.singletonList(new Object[]{202L, 40L, 20L}));

        Request request = Request.create(Request.HttpMethod.GET, "/api/content/pois/202",
                Collections.emptyMap(), null, StandardCharsets.UTF_8, new RequestTemplate());
        when(contentServiceClient.getPoiById(eq(202L), eq("vi")))
                .thenThrow(new FeignException.ServiceUnavailable("Service Down", request, null, null));

        // Call 1: Fails Feign call, caches null
        AnalyticsSummaryResponse summary1 = analyticsSummaryService.getSummary();
        assertThat(summary1.getTopPois().get(0).getName()).isNull();
        verify(contentServiceClient, times(1)).getPoiById(eq(202L), eq("vi"));

        // Call 2: Hits negative cache, does not call Feign again
        AnalyticsSummaryResponse summary2 = analyticsSummaryService.getSummary();
        assertThat(summary2.getTopPois().get(0).getName()).isNull();
        verify(contentServiceClient, times(1)).getPoiById(eq(202L), eq("vi")); // still 1
    }

    @Test
    @DisplayName("Cache expires after TTL and re-fetches POI name from Feign")
    void testCacheTtlExpiration_refetchesAfterTtl() throws InterruptedException {
        // Service with very short TTL of 50ms
        AnalyticsSummaryServiceImpl shortTtlService = new AnalyticsSummaryServiceImpl(
                analyticsEventRepository,
                contentServiceClient,
                50L,
                3000L
        );

        when(analyticsEventRepository.findTopPoisRaw(any(Pageable.class)))
                .thenReturn(Collections.singletonList(new Object[]{303L, 30L, 15L}));

        when(contentServiceClient.getPoiById(eq(303L), eq("vi")))
                .thenReturn(new ContentPoiResponse(303L, "Nhà hát"))
                .thenReturn(new ContentPoiResponse(303L, "Nhà hát Thành Phố"));

        // Call 1: Caches name
        AnalyticsSummaryResponse res1 = shortTtlService.getSummary();
        assertThat(res1.getTopPois().get(0).getName()).isEqualTo("Nhà hát");
        verify(contentServiceClient, times(1)).getPoiById(eq(303L), eq("vi"));

        // Wait for TTL to expire
        Thread.sleep(70);

        // Call 2: Expired, re-fetches
        AnalyticsSummaryResponse res2 = shortTtlService.getSummary();
        assertThat(res2.getTopPois().get(0).getName()).isEqualTo("Nhà hát Thành Phố");
        verify(contentServiceClient, times(2)).getPoiById(eq(303L), eq("vi"));
    }

    @Test
    @DisplayName("Total budget exceeded sets remaining POI names to null without blocking whole summary")
    void testTotalBudgetExceeded_remainingNamesNull() {
        // Service with small budget of 200ms
        AnalyticsSummaryServiceImpl tightBudgetService = new AnalyticsSummaryServiceImpl(
                analyticsEventRepository,
                contentServiceClient,
                300_000L,
                200L // 200ms budget
        );

        when(analyticsEventRepository.findTopPoisRaw(any(Pageable.class))).thenReturn(List.of(
                new Object[]{1L, 10L, 5L},
                new Object[]{2L, 8L, 4L},
                new Object[]{3L, 6L, 3L}
        ));

        // POI 1 simulates a slow call taking 250ms (exhausts budget)
        when(contentServiceClient.getPoiById(eq(1L), eq("vi"))).thenAnswer(inv -> {
            Thread.sleep(250);
            return new ContentPoiResponse(1L, "POI 1");
        });

        long start = System.currentTimeMillis();
        AnalyticsSummaryResponse summary = tightBudgetService.getSummary();
        long elapsed = System.currentTimeMillis() - start;

        assertThat(summary.getTopPois()).hasSize(3);
        // POI 2 and POI 3 must be null because budget was exhausted
        assertThat(summary.getTopPois().get(1).getName()).isNull();
        assertThat(summary.getTopPois().get(2).getName()).isNull();
        // Never called Feign for POI 2 and POI 3
        verify(contentServiceClient, never()).getPoiById(eq(2L), any());
        verify(contentServiceClient, never()).getPoiById(eq(3L), any());
        // Fast overall execution
        assertThat(elapsed).isLessThan(1500);
    }
}
