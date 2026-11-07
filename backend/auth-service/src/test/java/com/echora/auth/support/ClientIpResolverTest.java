package com.echora.auth.support;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    private final ClientIpResolver resolver = new ClientIpResolver();

    private MockHttpServletRequest request(String remoteAddr, String forwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddr);
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        return request;
    }

    @Test
    void ignoresForwardedForWhenNoTrustedProxiesConfigured() {
        resolver.setTrustedProxiesConfig("");

        assertThat(resolver.resolve(request("172.24.0.7", "203.0.113.9")))
                .isEqualTo("172.24.0.7");
    }

    @Test
    void ignoresForwardedForWhenPeerIsNotTrusted() {
        resolver.setTrustedProxiesConfig("10.0.0.0/8");

        assertThat(resolver.resolve(request("172.24.0.7", "203.0.113.9")))
                .isEqualTo("172.24.0.7");
    }

    @Test
    void honorsForwardedForWhenPeerMatchesExactIp() {
        resolver.setTrustedProxiesConfig("127.0.0.1");

        assertThat(resolver.resolve(request("127.0.0.1", "203.0.113.9")))
                .isEqualTo("203.0.113.9");
    }

    @Test
    void honorsForwardedForWhenPeerMatchesCidr() {
        resolver.setTrustedProxiesConfig("172.24.0.0/16");

        assertThat(resolver.resolve(request("172.24.0.7", "203.0.113.9, 172.24.0.1")))
                .isEqualTo("203.0.113.9");
    }

    @Test
    void fallsBackToSocketIpWhenForwardedForIsBlank() {
        resolver.setTrustedProxiesConfig("172.24.0.0/16");

        assertThat(resolver.resolve(request("172.24.0.7", "   ")))
                .isEqualTo("172.24.0.7");
    }

    @Test
    void ignoresOverlongForwardedForValue() {
        resolver.setTrustedProxiesConfig("172.24.0.0/16");

        assertThat(resolver.resolve(request("172.24.0.7", "x".repeat(200))))
                .isEqualTo("172.24.0.7");
    }

    @Test
    void handlesInvalidCidrEntryWithoutFailing() {
        resolver.setTrustedProxiesConfig("not-an-ip/99,172.24.0.0/16");

        assertThat(resolver.resolve(request("172.24.0.7", "203.0.113.9")))
                .isEqualTo("203.0.113.9");
    }

    @Test
    void returnsUnknownForNullRequest() {
        assertThat(resolver.resolve(null)).isEqualTo("unknown");
    }
}
