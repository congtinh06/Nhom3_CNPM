package com.echora.order.service;

import com.echora.order.entity.Order;
import com.echora.order.entity.Payment;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

@Service
@Slf4j
public class VnPayService {

    private static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String VERSION = "2.1.0";
    private static final String COMMAND = "pay";
    private static final String CURRENCY = "VND";

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final String frontendResultUrl;
    private final String locale;
    private final String orderType;

    public VnPayService(@Value("${app.vnpay.tmn-code:}") String tmnCode,
                        @Value("${app.vnpay.hash-secret:}") String hashSecret,
                        @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
                        @Value("${app.vnpay.return-url:}") String returnUrl,
                        @Value("${app.vnpay.frontend-result-url:http://localhost:5173/thanh-toan/ket-qua}") String frontendResultUrl,
                        @Value("${app.vnpay.locale:vn}") String locale,
                        @Value("${app.vnpay.order-type:other}") String orderType) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.frontendResultUrl = frontendResultUrl;
        this.locale = locale;
        this.orderType = orderType;
    }

    @PostConstruct
    void warnIfMisconfigured() {
        if (!isConfigured()) {
            log.warn("VNPAY is not configured (VNPAY_TMN_CODE / VNPAY_HASH_SECRET): VNPAY payments are disabled.");
        }
    }

    public boolean isConfigured() {
        return notBlank(tmnCode) && notBlank(hashSecret) && notBlank(returnUrl);
    }

    public String buildPaymentUrl(Order order, Payment payment, String ipAddress) {
        if (!isConfigured()) {
            throw new IllegalStateException("VNPAY is not configured");
        }

        LocalDateTime now = LocalDateTime.now(VNPAY_ZONE);
        LocalDateTime expireAt = payment.getOrder().getExpiresAt() != null
                ? payment.getOrder().getExpiresAt()
                : now.plusMinutes(15);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", VERSION);
        params.put("vnp_Command", COMMAND);
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", payment.getAmount().multiply(BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_CurrCode", CURRENCY);
        params.put("vnp_TxnRef", payment.getTxnRef());
        params.put("vnp_OrderInfo", "Thanh toan don hang " + order.getOrderCode());
        params.put("vnp_OrderType", orderType);
        params.put("vnp_Locale", locale);
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_CreateDate", now.format(VNPAY_TIME));
        params.put("vnp_ExpireDate", expireAt.atZone(ZoneId.systemDefault())
                .withZoneSameInstant(VNPAY_ZONE).format(VNPAY_TIME));

        String hashData = buildQuery(params);
        String secureHash = hmacSha512(hashSecret, hashData);
        return payUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    public Optional<VnPayCallback> verify(Map<String, String> params) {
        if (!isConfigured()) {
            return Optional.empty();
        }
        String secureHash = params.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return Optional.empty();
        }

        if (!tmnCode.equals(params.get("vnp_TmnCode"))) {
            log.warn("VNPAY TmnCode mismatch for txnRef={}", params.get("vnp_TxnRef"));
            return Optional.empty();
        }

        Map<String, String> filtered = new TreeMap<>();
        params.forEach((key, value) -> {
            if (key != null && key.startsWith("vnp_")
                    && !"vnp_SecureHash".equals(key)
                    && !"vnp_SecureHashType".equals(key)) {
                filtered.put(key, value);
            }
        });

        String expected = hmacSha512(hashSecret, buildQuery(filtered));
        if (!constantTimeEquals(expected, secureHash)) {
            log.warn("VNPAY signature mismatch for txnRef={}", params.get("vnp_TxnRef"));
            return Optional.empty();
        }

        BigDecimal amount;
        try {
            amount = new BigDecimal(params.getOrDefault("vnp_Amount", "0"))
                    .divide(BigDecimal.valueOf(100));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        return Optional.of(new VnPayCallback(
                params.get("vnp_TxnRef"),
                amount,
                params.getOrDefault("vnp_ResponseCode", ""),
                params.getOrDefault("vnp_TransactionStatus", ""),
                params.get("vnp_TransactionNo"),
                params.get("vnp_BankCode")));
    }

    public String buildFrontendResultUrl(String orderCode, String status) {
        return UriComponentsBuilder.fromUriString(frontendResultUrl)
                .queryParam("orderCode", orderCode)
                .queryParam("method", "VNPAY")
                .queryParam("status", status)
                .build()
                .encode()
                .toUriString();
    }

    private String buildQuery(Map<String, String> sortedParams) {
        StringBuilder query = new StringBuilder();
        sortedParams.forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                if (query.length() > 0) {
                    query.append('&');
                }
                query.append(key).append('=').append(URLEncoder.encode(value, StandardCharsets.UTF_8));
            }
        });
        return query.toString();
    }

    private String hmacSha512(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot sign VNPAY request", ex);
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return java.security.MessageDigest.isEqual(
                expected.toLowerCase().getBytes(StandardCharsets.UTF_8),
                actual.toLowerCase().getBytes(StandardCharsets.UTF_8));
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    public record VnPayCallback(String txnRef,
                                BigDecimal amount,
                                String responseCode,
                                String transactionStatus,
                                String transactionNo,
                                String bankCode) {
    }
}
