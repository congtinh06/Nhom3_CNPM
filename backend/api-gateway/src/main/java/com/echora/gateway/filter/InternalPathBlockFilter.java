package com.echora.gateway.filter;

import com.echora.gateway.handler.ProblemDetailSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class InternalPathBlockFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(InternalPathBlockFilter.class);

    private static final String CONTENT_PREFIX = "/api/content";
    private static final String INTERNAL_CONTENT_PREFIX = "/api/content/internal";
    private static final String ADMIN_CONTENT_PREFIX = "/api/content/admin";
    private static final String ADMIN_AUTH_PREFIX = "/api/auth/admin";
    private static final String ADMIN_PRODUCTS_PREFIX = "/api/admin/products";
    private static final String ADMIN_ORDERS_PREFIX = "/api/admin/orders";
    private static final String PRODUCT_IMAGES_PREFIX = "/img/products";

    private static final Pattern POI_DETAIL_OR_PUBLISH = Pattern.compile("^/api/content/admin/pois/\\d+(/publish-status)?$");
    private static final Pattern POI_STATUS = Pattern.compile("^/api/content/admin/pois/\\d+/status$");
    private static final Pattern POI_REPUBLISH = Pattern.compile("^/api/content/admin/pois/\\d+/republish$");
    private static final Pattern POI_AUDIO_REGEN = Pattern.compile("^/api/content/admin/pois/\\d+/audio/regenerate$");
    private static final Pattern ZONE_DETAIL = Pattern.compile("^/api/content/admin/zones/\\d+$");
    private static final Pattern ZONE_STATUS = Pattern.compile("^/api/content/admin/zones/\\d+/status$");
    private static final Pattern ROUTE_DETAIL = Pattern.compile("^/api/content/admin/routes/\\d+$");
    private static final Pattern ROUTE_STOPS = Pattern.compile("^/api/content/admin/routes/\\d+/stops$");
    private static final Pattern ROUTE_STATUS = Pattern.compile("^/api/content/admin/routes/\\d+/status$");
    private static final Pattern USER_DETAIL = Pattern.compile("^/api/auth/admin/users/\\d+$");
    private static final Pattern USER_ROLE = Pattern.compile("^/api/auth/admin/users/\\d+/role$");
    private static final Pattern USER_STATUS = Pattern.compile("^/api/auth/admin/users/\\d+/status$");
    private static final Pattern USER_PLAN = Pattern.compile("^/api/auth/admin/users/\\d+/plan$");
    private static final Pattern PRODUCT_DETAIL = Pattern.compile("^/api/admin/products/\\d+$");
    private static final Pattern PRODUCT_STATUS = Pattern.compile("^/api/admin/products/\\d+/status$");
    private static final Pattern PRODUCT_SORT_ORDER = Pattern.compile("^/api/admin/products/\\d+/sort-order$");
    private static final Pattern PRODUCT_IMAGE = Pattern.compile("^/api/admin/products/\\d+/image$");
    private static final Pattern ADMIN_ORDER_DETAIL = Pattern.compile("^/api/admin/orders/[A-Za-z0-9-]+$");
    private static final Pattern ADMIN_ORDER_STATUS = Pattern.compile("^/api/admin/orders/[A-Za-z0-9-]+/status$");
    private static final Pattern ADMIN_ORDER_CONFIRM = Pattern.compile("^/api/admin/orders/[A-Za-z0-9-]+/confirm-payment$");
    private static final Pattern ADMIN_ORDER_REJECT = Pattern.compile("^/api/admin/orders/[A-Za-z0-9-]+/reject-payment$");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        if (path == null) {
            return chain.filter(exchange);
        }

        // 1. Phục vụ ảnh sản phẩm (/img/products/**): GET và HEAD công khai; từ chối mọi method khác (405)
        if (path.equals(PRODUCT_IMAGES_PREFIX) || path.startsWith(PRODUCT_IMAGES_PREFIX + "/")) {
            if (HttpMethod.OPTIONS.equals(method)) {
                return chain.filter(exchange);
            }
            if (!HttpMethod.GET.equals(method) && !HttpMethod.HEAD.equals(method)) {
                log.warn("Blocked disallowed method [{}] on product image endpoint: {}", method, path);
                return sendMethodNotAllowed(exchange);
            }
            return chain.filter(exchange);
        }

        // 2. /api/content/internal/** (bất kỳ method nào) -> 404 Not Found
        if (path.equals(INTERNAL_CONTENT_PREFIX) || path.startsWith(INTERNAL_CONTENT_PREFIX + "/")) {
            log.warn("Blocked public access attempt to internal endpoint: {}", path);
            return sendNotFound(exchange);
        }

        // 3. Kiểm tra danh sách method cho phép trên các endpoint quản trị
        if (path.equals(ADMIN_CONTENT_PREFIX) || path.startsWith(ADMIN_CONTENT_PREFIX + "/")) {
            if (HttpMethod.OPTIONS.equals(method)) {
                return chain.filter(exchange);
            }
            String normalized = normalizePath(path);
            if (!isAllowedAdminContentMethod(normalized, method)) {
                log.warn("Blocked disallowed method [{}] on admin content endpoint: {}", method, path);
                return sendMethodNotAllowed(exchange);
            }
            return chain.filter(exchange);
        }

        if (path.equals(ADMIN_AUTH_PREFIX) || path.startsWith(ADMIN_AUTH_PREFIX + "/")) {
            if (HttpMethod.OPTIONS.equals(method)) {
                return chain.filter(exchange);
            }
            String normalized = normalizePath(path);
            if (!isAllowedAdminAuthMethod(normalized, method)) {
                log.warn("Blocked disallowed method [{}] on admin auth endpoint: {}", method, path);
                return sendMethodNotAllowed(exchange);
            }
            return chain.filter(exchange);
        }

        if (path.equals(ADMIN_ORDERS_PREFIX) || path.startsWith(ADMIN_ORDERS_PREFIX + "/")) {
            if (HttpMethod.OPTIONS.equals(method)) {
                return chain.filter(exchange);
            }
            String normalized = normalizePath(path);
            if (!isAllowedAdminOrderMethod(normalized, method)) {
                log.warn("Blocked disallowed method [{}] on admin order endpoint: {}", method, path);
                return sendMethodNotAllowed(exchange);
            }
            return chain.filter(exchange);
        }

        if (path.equals(ADMIN_PRODUCTS_PREFIX) || path.startsWith(ADMIN_PRODUCTS_PREFIX + "/")) {
            if (HttpMethod.OPTIONS.equals(method)) {
                return chain.filter(exchange);
            }
            String normalized = normalizePath(path);
            if (!isAllowedAdminProductMethod(normalized, method)) {
                log.warn("Blocked disallowed method [{}] on admin product endpoint: {}", method, path);
                return sendMethodNotAllowed(exchange);
            }
            return chain.filter(exchange);
        }

        // Nếu path không nằm dưới /api/content, cho phép đi tiếp (vd: /api/location/**, /api/tts/**, /api/analytics/**)
        if (!path.equals(CONTENT_PREFIX) && !path.startsWith(CONTENT_PREFIX + "/")) {
            return chain.filter(exchange);
        }

        // 4. Preflight OPTIONS requests for CORS must not be blocked
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }

        // 5. Mọi endpoint công khai khác dưới /api/content/**: CHỈ cho phép GET và HEAD
        if (!HttpMethod.GET.equals(method) && !HttpMethod.HEAD.equals(method)) {
            log.warn("Blocked disallowed method [{}] on public content endpoint: {}", method, path);
            return sendNotFound(exchange);
        }

        // 6. Path phải thuộc danh sách công khai tường minh
        if (!isAllowedPublicContentPath(path)) {
            log.warn("Blocked request to unrecognized content path: {}", path);
            return sendNotFound(exchange);
        }

        return chain.filter(exchange);
    }

    private String normalizePath(String path) {
        if (path == null || path.isEmpty()) {
            return "/";
        }
        String candidate = path;
        if (candidate.length() > 1 && candidate.endsWith("/")) {
            candidate = candidate.substring(0, candidate.length() - 1);
        }
        return candidate.toLowerCase(Locale.ROOT);
    }

    private boolean isAllowedAdminContentMethod(String path, HttpMethod method) {
        if (path.equals("/api/content/admin/pois")) {
            return HttpMethod.GET.equals(method) || HttpMethod.POST.equals(method);
        }
        if (path.equals("/api/content/admin/pois/publish-status")) {
            return HttpMethod.GET.equals(method);
        }
        if (POI_STATUS.matcher(path).matches()) {
            // Controller chỉ map PATCH/PUT cho đổi trạng thái; GET sẽ 405 ở content-service.
            return HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
        }
        if (POI_DETAIL_OR_PUBLISH.matcher(path).matches()) {
            if (path.endsWith("/publish-status")) {
                return HttpMethod.GET.equals(method);
            }
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method);
        }
        if (POI_REPUBLISH.matcher(path).matches()) {
            return HttpMethod.POST.equals(method);
        }
        if (path.equals("/api/content/admin/audio/regenerate") || POI_AUDIO_REGEN.matcher(path).matches()) {
            return HttpMethod.POST.equals(method);
        }

        if (path.equals("/api/content/admin/zones")) {
            return HttpMethod.GET.equals(method) || HttpMethod.POST.equals(method);
        }
        if (ZONE_STATUS.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
        }
        if (ZONE_DETAIL.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method);
        }

        if (path.equals("/api/content/admin/routes")) {
            return HttpMethod.GET.equals(method) || HttpMethod.POST.equals(method);
        }
        if (ROUTE_STOPS.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method);
        }
        if (ROUTE_STATUS.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
        }
        if (ROUTE_DETAIL.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method);
        }

        // Cho phép GET trên các route admin mới bổ sung (xem newlyAddedAdminRoutesAreProtectedByDefault)
        return HttpMethod.GET.equals(method);
    }

    private boolean isAllowedAdminAuthMethod(String path, HttpMethod method) {
        if (path.equals("/api/auth/admin/users")) {
            return HttpMethod.GET.equals(method);
        }
        if (USER_ROLE.matcher(path).matches() || USER_STATUS.matcher(path).matches() || USER_PLAN.matcher(path).matches()) {
            // USER_PLAN: AdminUserController#changePlan chỉ map PATCH/PUT (không có GET).
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
        }
        if (USER_DETAIL.matcher(path).matches()) {
            return HttpMethod.GET.equals(method);
        }

        // Cho phép GET trên các route admin mới bổ sung
        return HttpMethod.GET.equals(method);
    }

    private boolean isAllowedAdminOrderMethod(String path, HttpMethod method) {
        if (path.equals("/api/admin/orders")) {
            return HttpMethod.GET.equals(method);
        }
        if (ADMIN_ORDER_DETAIL.matcher(path).matches()) {
            return HttpMethod.GET.equals(method);
        }
        if (ADMIN_ORDER_STATUS.matcher(path).matches()) {
            return HttpMethod.PATCH.equals(method) || HttpMethod.PUT.equals(method);
        }
        if (ADMIN_ORDER_CONFIRM.matcher(path).matches() || ADMIN_ORDER_REJECT.matcher(path).matches()) {
            return HttpMethod.POST.equals(method);
        }
        return false;
    }

    private boolean isAllowedAdminProductMethod(String path, HttpMethod method) {
        if (path.equals("/api/admin/products")) {
            return HttpMethod.GET.equals(method) || HttpMethod.POST.equals(method);
        }
        if (PRODUCT_STATUS.matcher(path).matches() || PRODUCT_SORT_ORDER.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
        }
        if (PRODUCT_IMAGE.matcher(path).matches()) {
            return HttpMethod.POST.equals(method);
        }
        if (PRODUCT_DETAIL.matcher(path).matches()) {
            return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method);
        }

        // Cho phép GET trên các route admin mới bổ sung
        return HttpMethod.GET.equals(method);
    }

    private boolean isAllowedPublicContentPath(String path) {
        return path.equals("/api/content/categories") ||
                path.equals("/api/content/pois") || path.startsWith("/api/content/pois/") ||
                path.equals("/api/content/routes") || path.startsWith("/api/content/routes/") ||
                path.equals("/api/content/zones") || path.startsWith("/api/content/zones/") ||
                path.equals("/api/content/products") || path.startsWith("/api/content/products/") ||
                path.equals("/api/content/news") || path.startsWith("/api/content/news/");
    }

    private Mono<Void> sendNotFound(ServerWebExchange exchange) {
        return ProblemDetailSupport.write(exchange, HttpStatus.NOT_FOUND, "Not Found");
    }

    private Mono<Void> sendMethodNotAllowed(ServerWebExchange exchange) {
        return ProblemDetailSupport.write(exchange, HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed");
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }
}

