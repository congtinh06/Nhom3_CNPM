package com.echora.auth.support;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;

/**
 * Xác định IP thật của client một cách an toàn.
 *
 * <p>Chỉ tin hop đầu tiên của {@code X-Forwarded-For} khi peer TCP trực tiếp nằm trong danh sách
 * {@code app.trusted-proxies} (IP tuyệt đối hoặc CIDR). Nếu peer không đáng tin, trả về socket IP
 * để client không thể giả mạo header.
 */
@Component
public class ClientIpResolver {

    private static final Logger log = LoggerFactory.getLogger(ClientIpResolver.class);

    /** Độ dài tối đa của một địa chỉ IP dạng text (IPv6 đầy đủ là 45 ký tự). */
    private static final int MAX_IP_LENGTH = 45;

    @Value("${app.trusted-proxies:${TRUSTED_PROXIES:}}")
    private String trustedProxiesConfig;

    public void setTrustedProxiesConfig(String trustedProxiesConfig) {
        this.trustedProxiesConfig = trustedProxiesConfig;
    }

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String socketIp = request.getRemoteAddr();
        if (socketIp == null || socketIp.isBlank()) {
            return "unknown";
        }
        if (!isTrustedProxy(socketIp)) {
            return socketIp;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) {
            return socketIp;
        }
        String firstHop = forwarded.split(",")[0].trim();
        if (firstHop.isEmpty() || firstHop.length() > MAX_IP_LENGTH) {
            return socketIp;
        }
        return firstHop;
    }

    private boolean isTrustedProxy(String socketIp) {
        if (trustedProxiesConfig == null || trustedProxiesConfig.isBlank()) {
            return false;
        }
        InetAddress peer = parseLiteralIp(socketIp);
        for (String proxy : trustedProxiesConfig.split(",")) {
            String trimmed = proxy.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.indexOf('/') >= 0) {
                // Hỗ trợ CIDR (vd: 172.24.0.0/16) để không vỡ khi Docker cấp lại IP container.
                if (peer != null && matchesCidr(peer, trimmed)) {
                    return true;
                }
            } else if (trimmed.equalsIgnoreCase(socketIp)) {
                return true;
            }
        }
        return false;
    }

    /** Chỉ parse IP literal, không bao giờ phân giải DNS từ dữ liệu request. */
    private InetAddress parseLiteralIp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return InetAddress.getByName(value.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private boolean matchesCidr(InetAddress peer, String cidr) {
        int slash = cidr.indexOf('/');
        try {
            InetAddress network = InetAddress.getByName(cidr.substring(0, slash).trim());
            int prefixLength = Integer.parseInt(cidr.substring(slash + 1).trim());

            byte[] peerBytes = peer.getAddress();
            byte[] networkBytes = network.getAddress();
            if (peerBytes.length != networkBytes.length) {
                return false;
            }

            int maxBits = peerBytes.length * 8;
            if (prefixLength < 0 || prefixLength > maxBits) {
                log.warn("Ignoring trusted proxy with invalid CIDR prefix: {}", cidr);
                return false;
            }

            int fullBytes = prefixLength / 8;
            for (int i = 0; i < fullBytes; i++) {
                if (peerBytes[i] != networkBytes[i]) {
                    return false;
                }
            }

            int remainingBits = prefixLength % 8;
            if (remainingBits == 0) {
                return true;
            }
            int mask = (0xFF << (8 - remainingBits)) & 0xFF;
            return (peerBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
        } catch (Exception ex) {
            log.warn("Ignoring invalid trusted proxy CIDR entry: {}", cidr);
            return false;
        }
    }
}
