package com.echora.content.config;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 8)
@Slf4j
public class EntitlementFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_PLAN = "X-User-Plan";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    public static final String ATTRIBUTE_PREMIUM = "premiumEntitlement";
    public static final String ATTRIBUTE_PURCHASED_POIS = "purchasedPoiIds";

    private static final String POIS_PREFIX = "/api/content/pois/";
    private static final String GUIDE_PATH = "/api/content/pois/guide";
    private static final String QR_PREFIX = "/api/content/pois/qr/";
    private static final String PREMIUM_REQUIRED_MESSAGE =
            "NgA'n ng��_ nA�y yA�u c��u gA3i Premium �`ang ho���t �`��Tng.";
    private static final String POI_LOCKED_MESSAGE =
            "�?i���m thuy���t minh nA�y yA�u c��u gA3i Premium ho���c mua l��� gA3i ngo���i ng��_.";

    private final InternalPoiEntitlementClient poiEntitlementClient;

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    public EntitlementFilter(InternalPoiEntitlementClient poiEntitlementClient) {
        this.poiEntitlementClient = poiEntitlementClient;
    }


    /** Port nội bộ để filter map qrToken -> poiId cho luồng mua lẻ theo POI. */
    public interface PoiLookup {
        Long findPoiIdByQrToken(String qrToken);
    }

    @PostConstruct
    void warnIfMissing() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: premium entitlement cannot be verified.");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        // Ma QR tai diem den la cong khai: khach quet ma duoc doc ban dich
        // o moi ngon ngu ma khong can goi Premium.
        if (path.startsWith(QR_PREFIX)) {
            return true;
        }
        if (GUIDE_PATH.equals(path)) {
            return false;
        }
        if (!path.startsWith(POIS_PREFIX)) {
            return true;
        }
        String id = path.substring(POIS_PREFIX.length());
        return id.isEmpty() || !id.chars().allMatch(Character::isDigit);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String userIdHeader = request.getHeader(HEADER_USER_ID);
        boolean hasTrustedIdentity = userIdHeader != null
                || request.getHeader(HEADER_USER_PLAN) != null;
        boolean premium = false;
        List<Long> purchasedPois = List.of();

        if (hasTrustedIdentity) {
            if (isBlank(expectedApiKey)
                    || !constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)) {
                reject(response, HttpServletResponse.SC_FORBIDDEN,
                        "Không thể xác minh quyền truy cập nội dung.");
                return;
            }
            premium = "PREMIUM".equalsIgnoreCase(request.getHeader(HEADER_USER_PLAN));
            if (!premium && !isBlank(userIdHeader)) {
                try {
                    purchasedPois = poiEntitlementClient.purchasedPoiIds(Long.valueOf(userIdHeader.trim()));
                } catch (NumberFormatException ex) {
                    log.warn("X-User-Id không hợp lệ: {}", userIdHeader);
                }
            }
        }

        String lang = request.getParameter("lang");
        String normalized = lang == null || lang.isBlank() ? "vi" : lang.trim().toLowerCase();
        if (!"vi".equals(normalized) && !premium) {
            if (purchasedPois.isEmpty()) {
                reject(response, HttpServletResponse.SC_FORBIDDEN, PREMIUM_REQUIRED_MESSAGE);
                return;
            }

            // Người dùng có mua lẻ: cho phép nếu ít nhất một POI trong kết quả sắp trả
            // đã được mua (guide trả nhiều POI; single path kiểm tra đúng POI đó).
            if (GUIDE_PATH.equals(request.getRequestURI())) {
                // Trả lời bình thường, controller chỉ include bản dịch của POI đã mua,
                // nhưng nếu ngược lại KHÔNG có POI nào được mua thì vẫn chặn ngay.
                request.setAttribute(ATTRIBUTE_PREMIUM, false);
                request.setAttribute(ATTRIBUTE_PURCHASED_POIS, Set.copyOf(purchasedPois));
                filterChain.doFilter(request, response);
                return;
            }

            Long poiId = resolvePoiId(request);
            if (poiId == null || !purchasedPois.contains(poiId)) {
                reject(response, HttpServletResponse.SC_FORBIDDEN, POI_LOCKED_MESSAGE);
                return;
            }
        }

        request.setAttribute(ATTRIBUTE_PREMIUM, premium);
        if (!purchasedPois.isEmpty()) {
            request.setAttribute(ATTRIBUTE_PURCHASED_POIS, Set.copyOf(purchasedPois));
        }
        filterChain.doFilter(request, response);
    }

    private Long resolvePoiId(HttpServletRequest request) {
        String path = request.getRequestURI();
        String id = path.substring(POIS_PREFIX.length());
        try {
            return Long.valueOf(id.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static boolean constantTimeEquals(String incoming, String expected) {
        if (incoming == null) {
            return false;
        }
        return MessageDigest.isEqual(
                incoming.getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8));
    }

    private static void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
