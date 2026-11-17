package com.echora.order.service;

import com.echora.order.entity.Order;
import com.echora.order.entity.Payment;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class VnPayServiceOriginTest {

    private final VnPayService service = new VnPayService(
            "TMN123",
            "secret",
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            "https://example.ngrok-free.dev/api/orders/vnpay/return",
            "https://nhom3-cnpm.vercel.app/thanh-toan/ket-qua",
            "vn",
            "other");

    @Test
    void resultUrlUsesStoredOriginForLocalDev() {
        String url = service.buildFrontendResultUrl("ORD1", "failed", "http://localhost:5173");

        assertThat(url).startsWith("http://localhost:5173/thanh-toan/ket-qua?");
        assertThat(url).contains("orderCode=ORD1", "method=VNPAY", "status=failed");
    }

    @Test
    void resultUrlFallsBackToConfiguredBaseWhenOriginMissing() {
        String url = service.buildFrontendResultUrl("ORD1", "success", null);

        assertThat(url).startsWith("https://nhom3-cnpm.vercel.app/thanh-toan/ket-qua?");
    }

    @Test
    void paymentUrlUsesOriginForReturnUrl() {
        Order order = Order.builder()
                .orderCode("ORD1")
                .totalAmount(new BigDecimal("100000"))
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        Payment payment = Payment.builder()
                .order(order)
                .txnRef("ORD1-1")
                .amount(new BigDecimal("100000"))
                .frontendOrigin("http://localhost:5173")
                .build();

        String url = service.buildPaymentUrl(order, payment, "127.0.0.1");

        assertThat(url).contains("vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Fapi%2Forders%2Fvnpay%2Freturn");
    }

    @Test
    void paymentUrlFallsBackToConfiguredReturnUrlWithoutOrigin() {
        Order order = Order.builder()
                .orderCode("ORD1")
                .totalAmount(new BigDecimal("100000"))
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        Payment payment = Payment.builder()
                .order(order)
                .txnRef("ORD1-1")
                .amount(new BigDecimal("100000"))
                .build();

        String url = service.buildPaymentUrl(order, payment, "127.0.0.1");

        assertThat(url).contains("vnp_ReturnUrl=https%3A%2F%2Fexample.ngrok-free.dev%2Fapi%2Forders%2Fvnpay%2Freturn");
    }

    @Test
    void sanitizeOriginKeepsSchemeHostAndPort() {
        assertThat(VnPayService.sanitizeOrigin("http://localhost:5173")).isEqualTo("http://localhost:5173");
        assertThat(VnPayService.sanitizeOrigin("https://nhom3-cnpm.vercel.app/thanh-toan/ket-qua?x=1"))
                .isEqualTo("https://nhom3-cnpm.vercel.app");
        assertThat(VnPayService.sanitizeOrigin("http://localhost:80")).isEqualTo("http://localhost");
        assertThat(VnPayService.sanitizeOrigin("https://nhom3-cnpm.vercel.app:443")).isEqualTo("https://nhom3-cnpm.vercel.app");
    }

    @Test
    void sanitizeOriginRejectsUnsafeValues() {
        assertThat(VnPayService.sanitizeOrigin(null)).isNull();
        assertThat(VnPayService.sanitizeOrigin("")).isNull();
        assertThat(VnPayService.sanitizeOrigin("null")).isNull();
        assertThat(VnPayService.sanitizeOrigin("javascript:alert(1)")).isNull();
        assertThat(VnPayService.sanitizeOrigin("ftp://example.com")).isNull();
    }
}
