package com.echora.content.config;

import com.echora.content.exception.EntitlementServiceUnavailableException;
import com.echora.content.exception.ProblemDetailWriter;
import com.echora.content.service.PoiContentService;
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
            "Ngôn ngữ này yêu cầu gói Premium đang hoạt động.";
    private static final String POI_LOCKED_MESSAGE =
            "Điểm thuyết minh này yêu cầu gói Premium hoặc mua lẻ gói ngoại ngữ.";
    private static final String ENTITLEMENT_UNAVAILABLE_MESSAGE =
            "Không thể xác minh quyền truy cập nội dung lúc này. Vui lòng thử lại sau.";
    private static final String RETRY_AFTER_SECONDS = "10";

    private final InternalPoiEntitlementClient poiEntitlementClient;
    private final PoiContentService poiContentService;

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    public EntitlementFilter(InternalPoiEntitlementClient poiEntitlementClient,
                             PoiContentService poiContentService) {
        this.poiEntitlementClient = poiEntitlementClient;
        this.poiContentService = poiContentService;
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
        // Mã QR tại điểm đến cũng phải tuân thủ quy tắc ngoại ngữ: chỉ tiếng Việt
        // là miễn phí, EN/JA/KO cần Premium hoặc mua lẻ đúng điểm này.
        if (GUIDE_PATH.equals(path)) {
            return false;
        }
        if (!path.startsWith(POIS_PREFIX)) {
            return true;
        }
        String id = path.substring(POIS_PREFIX.length());
        if (id.isEmpty()) {
            return true;
        }
        if (id.equals("qr") || id.startsWith("qr/")) {
            return false;
        }
        return !id.chars().allMatch(Character::isDigit);
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
                reject(request, response, HttpServletResponse.SC_FORBIDDEN,
                        "Không thể xác minh quyền truy cập nội dung.");
                return;
            }
            premium = "PREMIUM".equalsIgnoreCase(request.getHeader(HEADER_USER_PLAN));
            if (!premium && !isBlank(userIdHeader)) {
                try {
                    purchasedPois = poiEntitlementClient.purchasedPoiIds(Long.valueOf(userIdHeader.trim()));
                } catch (EntitlementServiceUnavailableException ex) {
                    // Fail closed: an auth-service outage must never be treated as "no purchase"
                    // and must never grant Premium content.
                    log.warn("auth-service entitlement check unavailable (userId={}); failing closed: {}",
                            userIdHeader, ex.getMessage());
                    response.setHeader("Retry-After", RETRY_AFTER_SECONDS);
                    reject(request, response, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                            ENTITLEMENT_UNAVAILABLE_MESSAGE);
                    return;
                } catch (NumberFormatException ex) {
                    log.warn("X-User-Id không hợp lệ: {}", userIdHeader);
                }
            }
        }

        String lang = request.getParameter("lang");
        String normalized = lang == null || lang.isBlank() ? "vi" : lang.trim().toLowerCase();
        if (!"vi".equals(normalized) && !premium) {
            if (purchasedPois.isEmpty()) {
                reject(request, response, HttpServletResponse.SC_FORBIDDEN, PREMIUM_REQUIRED_MESSAGE);
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
                reject(request, response, HttpServletResponse.SC_FORBIDDEN, POI_LOCKED_MESSAGE);
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
        if (path.startsWith(QR_PREFIX)) {
            String qrToken = path.substring(QR_PREFIX.length());
            if (isBlank(qrToken) || qrToken.contains("/")) {
                return null;
            }
            return poiContentService.findPoiIdByQrToken(qrToken).orElse(null);
        }
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

    private static void reject(HttpServletRequest request, HttpServletResponse response,
                               int status, String message) throws IOException {
        ProblemDetailWriter.write(response, request, status, message);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
