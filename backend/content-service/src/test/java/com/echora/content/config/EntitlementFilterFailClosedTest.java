package com.echora.content.config;

import com.echora.content.exception.EntitlementServiceUnavailableException;
import com.echora.content.service.PoiContentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class EntitlementFilterFailClosedTest {

    private InternalPoiEntitlementClient entitlementClient;
    private PoiContentService poiContentService;
    private EntitlementFilter filter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        entitlementClient = mock(InternalPoiEntitlementClient.class);
        poiContentService = mock(PoiContentService.class);
        filter = new EntitlementFilter(entitlementClient, poiContentService);
        ReflectionTestUtils.setField(filter, "expectedApiKey", "internal-secret");
    }

    @Test
    @DisplayName("auth-service outage returns 503 ProblemDetail with Retry-After and never reaches the controller")
    void authOutageFailsClosed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/content/pois/42");
        request.addParameter("lang", "en");
        request.addHeader(EntitlementFilter.HEADER_USER_ID, "5");
        request.addHeader(EntitlementFilter.HEADER_USER_PLAN, "FREE");
        request.addHeader(EntitlementFilter.HEADER_INTERNAL_API_KEY, "internal-secret");
        request.addHeader("X-Trace-Id", "trace-entitlement-1");

        when(entitlementClient.purchasedPoiIds(5L))
                .thenThrow(new EntitlementServiceUnavailableException("auth down", new RuntimeException()));

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(503);
        assertThat(response.getHeader("Retry-After")).isEqualTo("10");
        assertThat(response.getContentType()).startsWith("application/problem+json");
        assertThat(response.getHeader("X-Trace-Id")).isEqualTo("trace-entitlement-1");

        Map<String, Object> body = objectMapper.readValue(
                response.getContentAsString(), new TypeReference<>() {
                });
        assertThat(body).containsKeys("type", "title", "status", "detail", "instance", "traceId");
        assertThat(body.get("status")).isEqualTo(503);
        assertThat(body.get("instance")).isEqualTo("/api/content/pois/42");
        assertThat(body.get("traceId")).isEqualTo("trace-entitlement-1");

        verifyNoInteractions(chain);
    }
}
