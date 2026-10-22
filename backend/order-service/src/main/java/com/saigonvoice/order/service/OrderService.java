package com.saigonvoice.order.service;

import com.saigonvoice.order.dto.AdminOrderResponse;
import com.saigonvoice.order.dto.AdminPaymentResponse;
import com.saigonvoice.order.dto.CreateOrderItemRequest;
import com.saigonvoice.order.dto.CreateOrderRequest;
import com.saigonvoice.order.dto.CreatePremiumOrderRequest;
import com.saigonvoice.order.dto.OrderItemResponse;
import com.saigonvoice.order.dto.OrderResponse;
import com.saigonvoice.order.dto.PaymentStatusResponse;
import com.saigonvoice.order.dto.PaymentUrlResponse;
import com.saigonvoice.order.dto.ProductPrice;
import com.saigonvoice.order.entity.Order;
import com.saigonvoice.order.entity.OrderItem;
import com.saigonvoice.order.entity.OrderStatus;
import com.saigonvoice.order.entity.Payment;
import com.saigonvoice.order.entity.PaymentMethod;
import com.saigonvoice.order.entity.PaymentProvider;
import com.saigonvoice.order.entity.PaymentStatus;
import com.saigonvoice.order.exception.BadRequestException;
import com.saigonvoice.order.exception.ForbiddenException;
import com.saigonvoice.order.exception.NotFoundException;
import com.saigonvoice.order.exception.ServiceUnavailableException;
import com.saigonvoice.order.repository.OrderRepository;
import com.saigonvoice.order.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private static final int PAYMENT_EXPIRE_MINUTES = 15;
    private static final Set<OrderStatus> CANCELLABLE = EnumSet.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING);
    public static final String ORDER_TYPE_PRODUCT = "PRODUCT";
    public static final String ORDER_TYPE_PREMIUM = "PREMIUM";
    public static final String PREMIUM_PACKAGE_LANGUAGES = "PREMIUM_LANGUAGES";

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductPriceClient productPriceClient;
    private final AuthEntitlementClient authEntitlementClient;
    private final VnPayService vnPayService;

    @Value("${app.pricing.shipping-fee:20000}")
    private BigDecimal shippingFee;

    @Value("${app.pricing.free-shipping-threshold:50000}")
    private BigDecimal freeShippingThreshold;

    @Value("${app.payments.mock-enabled:true}")
    private boolean mockEnabled;

    @Value("${app.premium.price:500000}")
    private BigDecimal premiumPrice;

    @Transactional
    public OrderResponse createOrder(Long userId,
                                     String idempotencyKey,
                                     CreateOrderRequest request,
                                     String ipAddress) {
        String key = normalizeKey(idempotencyKey);
        if (key != null) {
            Optional<Order> existing = orderRepository.findByUserIdAndIdempotencyKey(userId, key);
            if (existing.isPresent()) {
                return toResponse(existing.get(), null);
            }
        }

        if (request.getPaymentMethod() == PaymentMethod.VNPAY && !vnPayService.isConfigured()) {
            throw new ServiceUnavailableException("Cổng thanh toán VNPAY chưa được cấu hình.");
        }

        Map<Long, Integer> quantities = mergeItems(request.getItems());
        Map<Long, ProductPrice> prices = productPriceClient.fetchPrices(quantities.keySet());

        Order order = Order.builder()
                .userId(userId)
                .receiverName(request.getReceiverName().trim())
                .phone(request.getPhone().trim())
                .address(request.getAddress().trim())
                .note(request.getNote() == null ? null : request.getNote().trim())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .idempotencyKey(key)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            ProductPrice product = prices.get(entry.getKey());
            if (product == null || !Boolean.TRUE.equals(product.getIsActive()) || product.getPrice() == null) {
                throw new BadRequestException("Sản phẩm #" + entry.getKey() + " không tồn tại hoặc đã ngừng bán.");
            }
            BigDecimal unitPrice = product.getPrice();
            int quantity = entry.getValue();
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));

            order.addItem(OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .unitPrice(unitPrice)
                    .quantity(quantity)
                    .build());
        }

        BigDecimal shipping = subtotal.compareTo(freeShippingThreshold) >= 0 ? BigDecimal.ZERO : shippingFee;
        order.setSubtotal(subtotal);
        order.setShippingFee(shipping);
        order.setTotalAmount(subtotal.add(shipping));

        boolean waitingForPayment = request.getPaymentMethod() != PaymentMethod.COD;
        order.setStatus(waitingForPayment ? OrderStatus.PENDING_PAYMENT : OrderStatus.PROCESSING);
        if (waitingForPayment) {
            order.setExpiresAt(LocalDateTime.now().plusMinutes(PAYMENT_EXPIRE_MINUTES));
        }
        order.setOrderCode(generateUniqueOrderCode());

        try {
            order = orderRepository.save(order);
        } catch (DataIntegrityViolationException ex) {
            if (key != null) {
                Optional<Order> existing = orderRepository.findByUserIdAndIdempotencyKey(userId, key);
                if (existing.isPresent()) {
                    return toResponse(existing.get(), null);
                }
            }
            throw ex;
        }

        String paymentUrl = null;
        if (request.getPaymentMethod() == PaymentMethod.VNPAY) {
            paymentUrl = createVnPayPayment(order, ipAddress).getPaymentUrl();
        }

        return toResponse(order, paymentUrl);
    }

    @Transactional
    public OrderResponse createPremiumOrder(Long userId,
                                            String idempotencyKey,
                                            CreatePremiumOrderRequest request,
                                            String ipAddress) {
        String packageCode = request == null || request.getPackageCode() == null
                || request.getPackageCode().isBlank()
                ? PREMIUM_PACKAGE_LANGUAGES
                : request.getPackageCode().trim().toUpperCase(Locale.ROOT);
        if (!PREMIUM_PACKAGE_LANGUAGES.equals(packageCode)) {
            throw new BadRequestException("Goi Premium khong hop le.");
        }
        if (!vnPayService.isConfigured()) {
            throw new ServiceUnavailableException("Cong thanh toan VNPAY chua duoc cau hinh.");
        }

        String key = normalizeKey(idempotencyKey);
        if (key != null) {
            Optional<Order> existing = orderRepository.findByUserIdAndIdempotencyKey(userId, key);
            if (existing.isPresent()) {
                Order order = existing.get();
                String existingUrl = order.getStatus() == OrderStatus.PENDING_PAYMENT
                        ? createVnPayPayment(order, ipAddress).getPaymentUrl()
                        : null;
                return toResponse(order, existingUrl);
            }
        }

        Order order = Order.builder()
                .userId(userId)
                .receiverName("Echora Premium")
                .phone("0000000000")
                .address("Goi ky thuat so - khong giao hang")
                .note("Goi Premium 3 ngon ngu: English, Japanese, Korean")
                .orderType(ORDER_TYPE_PREMIUM)
                .premiumPackage(packageCode)
                .paymentMethod(PaymentMethod.VNPAY)
                .paymentStatus(PaymentStatus.PENDING)
                .idempotencyKey(key)
                .subtotal(premiumPrice)
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(premiumPrice)
                .status(OrderStatus.PENDING_PAYMENT)
                .expiresAt(LocalDateTime.now().plusMinutes(PAYMENT_EXPIRE_MINUTES))
                .orderCode(generateUniqueOrderCode())
                .build();

        try {
            order = orderRepository.save(order);
        } catch (DataIntegrityViolationException ex) {
            if (key != null) {
                Optional<Order> existing = orderRepository.findByUserIdAndIdempotencyKey(userId, key);
                if (existing.isPresent()) {
                    return toResponse(existing.get(), null);
                }
            }
            throw ex;
        }

        String paymentUrl = createVnPayPayment(order, ipAddress).getPaymentUrl();
        return toResponse(order, paymentUrl);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(order -> !ORDER_TYPE_PREMIUM.equals(order.getOrderType()))
                .map(order -> toResponse(order, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long userId, String orderCode) {
        return toResponse(requireOwnedOrder(userId, orderCode), null);
    }

    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(Long userId, String orderCode) {
        Order order = requireOwnedOrder(userId, orderCode);
        return PaymentStatusResponse.builder()
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .expiresAt(order.getExpiresAt())
                .build();
    }

    @Transactional
    public OrderResponse cancelOrder(Long userId, String orderCode) {
        Order order = requireOwnedOrder(userId, orderCode);
        if (!CANCELLABLE.contains(order.getStatus())) {
            throw new BadRequestException("Đơn hàng không thể hủy ở trạng thái hiện tại.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            for (Payment payment : paymentRepository.findByOrderIdAndStatus(order.getId(), PaymentStatus.PENDING)) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }
        }
        return toResponse(orderRepository.save(order), null);
    }

    @Transactional
    public PaymentUrlResponse createVnPayPayment(Long userId, String orderCode, String ipAddress) {
        Order order = requireOwnedOrder(userId, orderCode);
        return createVnPayPayment(order, ipAddress);
    }

    @Transactional
    public OrderResponse confirmDemoTransfer(Long userId, String orderCode, String outcome) {
        if (!mockEnabled) {
            throw new ForbiddenException("Chức năng xác nhận chuyển khoản demo đang tắt.");
        }
        Order order = requireOwnedOrder(userId, orderCode);
        if (order.getPaymentMethod() != PaymentMethod.VIETQR) {
            throw new BadRequestException("Đơn hàng không dùng phương thức VietQR.");
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán.");
        }

        if ("SUCCESS".equalsIgnoreCase(outcome)) {
            order.setStatus(OrderStatus.PAID);
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            order.setPaidAt(LocalDateTime.now());
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }
        return toResponse(orderRepository.save(order), null);
    }

    @Transactional
    public OrderResponse extendExpiry(Long userId, String orderCode, int minutes) {
        Order order = requireOwnedOrder(userId, orderCode);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán.");
        }
        int safeMinutes = Math.min(Math.max(minutes, 1), 60);
        order.setExpiresAt(LocalDateTime.now().plusMinutes(safeMinutes));
        return toResponse(orderRepository.save(order), null);
    }

    // ---------------------------------------------------------------------
    // Quản trị: danh sách, chi tiết, xác nhận thanh toán và trạng thái giao hàng
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<AdminOrderResponse> getAdminOrders(String orderType,
                                                   String status,
                                                   String paymentStatus,
                                                   String search,
                                                   int page,
                                                   int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Order> spec = (root, query, cb) -> cb.conjunction();
        if (StringUtils.hasText(orderType)) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("orderType"),
                    parseEnumName(orderType, "Loại đơn hàng")));
        }
        if (StringUtils.hasText(status)) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"),
                    parseStatus(status)));
        }
        if (StringUtils.hasText(paymentStatus)) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("paymentStatus"),
                    parsePaymentStatus(paymentStatus)));
        }
        if (StringUtils.hasText(search)) {
            String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("orderCode")), pattern, '\\'),
                    cb.like(cb.lower(root.get("receiverName")), pattern, '\\'),
                    cb.like(root.get("phone"), pattern, '\\')));
        }

        return orderRepository.findAll(spec, pageable)
                .map(order -> toAdminResponse(order, false));
    }

    @Transactional(readOnly = true)
    public AdminOrderResponse getAdminOrder(String orderCode) {
        return toAdminResponse(requireOrder(orderCode), true);
    }

    @Transactional
    public AdminOrderResponse confirmPayment(String orderCode) {
        Order order = requireOrder(orderCode);
        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return toAdminResponse(order, true);
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã hủy, không thể xác nhận thanh toán.");
        }

        LocalDateTime now = LocalDateTime.now();
        markPaymentsReceived(order, now);
        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setPaidAt(now);
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.PAID);
        }
        orderRepository.save(order);

        if (ORDER_TYPE_PREMIUM.equals(order.getOrderType())) {
            authEntitlementClient.activatePremium(order);
        }
        return toAdminResponse(order, true);
    }

    @Transactional
    public AdminOrderResponse rejectPayment(String orderCode) {
        Order order = requireOrder(orderCode);
        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException("Đơn hàng đã thanh toán, không thể đánh dấu thất bại.");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Đơn hàng đã hoàn tất, không thể thay đổi thanh toán.");
        }

        order.setPaymentStatus(PaymentStatus.FAILED);
        order.setStatus(OrderStatus.CANCELLED);
        for (Payment payment : paymentRepository.findByOrderIdAndStatus(order.getId(), PaymentStatus.PENDING)) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
        return toAdminResponse(orderRepository.save(order), true);
    }

    @Transactional
    public AdminOrderResponse updateOrderStatus(String orderCode, String targetStatus) {
        Order order = requireOrder(orderCode);
        OrderStatus target = parseStatus(targetStatus);
        OrderStatus current = order.getStatus();
        if (target == current) {
            return toAdminResponse(order, true);
        }

        switch (target) {
            case PROCESSING -> {
                if (current != OrderStatus.PAID) {
                    throw new BadRequestException("Chỉ có thể bắt đầu xử lý đơn đã thanh toán.");
                }
            }
            case COMPLETED -> {
                if (current != OrderStatus.PAID && current != OrderStatus.PROCESSING) {
                    throw new BadRequestException("Chỉ có thể hoàn tất đơn đang xử lý hoặc đã thanh toán.");
                }
                if (order.getPaymentMethod() == PaymentMethod.COD) {
                    if (order.getPaymentStatus() != PaymentStatus.SUCCESS) {
                        markPaymentsReceived(order, LocalDateTime.now());
                        order.setPaymentStatus(PaymentStatus.SUCCESS);
                        order.setPaidAt(LocalDateTime.now());
                    }
                } else if (order.getPaymentStatus() != PaymentStatus.SUCCESS) {
                    throw new BadRequestException("Đơn hàng chưa được xác nhận thanh toán.");
                }
            }
            case CANCELLED -> {
                if (current == OrderStatus.COMPLETED) {
                    throw new BadRequestException("Đơn hàng đã hoàn tất, không thể hủy.");
                }
                if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
                    throw new BadRequestException(
                            "Đơn hàng đã thanh toán. Vui lòng xử lý hoàn tiền trước khi hủy.");
                }
                for (Payment payment : paymentRepository.findByOrderIdAndStatus(order.getId(), PaymentStatus.PENDING)) {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                }
            }
            default -> throw new BadRequestException(
                    "Không hỗ trợ chuyển đơn hàng sang trạng thái " + target + ".");
        }

        order.setStatus(target);
        return toAdminResponse(orderRepository.save(order), true);
    }

    private void markPaymentsReceived(Order order, LocalDateTime paidAt) {
        List<Payment> pending = paymentRepository.findByOrderIdAndStatus(order.getId(), PaymentStatus.PENDING);
        if (pending.isEmpty() && order.getPaymentMethod() == PaymentMethod.VIETQR) {
            Payment manual = Payment.builder()
                    .order(order)
                    .provider(PaymentProvider.DEMO_TRANSFER)
                    .txnRef(order.getOrderCode() + "-ADMIN-" + System.currentTimeMillis())
                    .amount(order.getTotalAmount())
                    .status(PaymentStatus.SUCCESS)
                    .createdAt(paidAt)
                    .paidAt(paidAt)
                    .build();
            paymentRepository.save(manual);
            return;
        }
        for (Payment payment : pending) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(paidAt);
            paymentRepository.save(payment);
        }
    }

    private Order requireOrder(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng."));
    }

    private static String parseEnumName(String value, String label) {
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!normalized.equals(ORDER_TYPE_PRODUCT) && !normalized.equals(ORDER_TYPE_PREMIUM)) {
            throw new BadRequestException(label + " không hợp lệ.");
        }
        return normalized;
    }

    private static OrderStatus parseStatus(String value) {
        try {
            return OrderStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException ex) {
            throw new BadRequestException("Trạng thái đơn hàng không hợp lệ.");
        }
    }

    private static PaymentStatus parsePaymentStatus(String value) {
        try {
            return PaymentStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException ex) {
            throw new BadRequestException("Trạng thái thanh toán không hợp lệ.");
        }
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    @Transactional
    public String handleVnPayReturn(Map<String, String> params) {
        Optional<VnPayService.VnPayCallback> verified = vnPayService.verify(params);
        if (verified.isEmpty()) {
            return vnPayService.buildFrontendResultUrl("", "failed");
        }
        VnPayService.VnPayCallback callback = verified.get();
        Payment payment = paymentRepository.findByTxnRef(callback.txnRef()).orElse(null);
        if (payment == null) {
            return vnPayService.buildFrontendResultUrl("", "failed");
        }

        Order order = payment.getOrder();
        boolean amountMatches = payment.getAmount().compareTo(callback.amount()) == 0;
        boolean success = isSuccessfulPayment(callback) && amountMatches;

        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return vnPayService.buildFrontendResultUrl(order.getOrderCode(), "success");
        }

        if (success) {
            markPaid(order, payment, callback);
        } else if (amountMatches) {
            failPayment(order, payment, callback);
        }

        String status = success ? "success" : resultStatus(callback);
        return vnPayService.buildFrontendResultUrl(order.getOrderCode(), status);
    }

    @Transactional
    public Map<String, String> handleVnPayIpn(Map<String, String> params) {
        Optional<VnPayService.VnPayCallback> verified = vnPayService.verify(params);
        if (verified.isEmpty()) {
            return ipnResponse("97", "Invalid signature");
        }

        VnPayService.VnPayCallback callback = verified.get();
        Payment payment = paymentRepository.findByTxnRef(callback.txnRef()).orElse(null);
        if (payment == null) {
            return ipnResponse("01", "Order not found");
        }
        if (payment.getAmount().compareTo(callback.amount()) != 0) {
            return ipnResponse("04", "Invalid amount");
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return ipnResponse("02", "Order already confirmed");
        }

        Order order = payment.getOrder();
        if (isSuccessfulPayment(callback)) {
            markPaid(order, payment, callback);
        } else {
            failPayment(order, payment, callback);
        }

        return ipnResponse("00", "Confirm Success");
    }

    private PaymentUrlResponse createVnPayPayment(Order order, String ipAddress) {
        if (order.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new BadRequestException("Đơn hàng không dùng phương thức VNPAY.");
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán.");
        }
        if (!vnPayService.isConfigured()) {
            throw new ServiceUnavailableException("Cổng thanh toán VNPAY chưa được cấu hình.");
        }

        if (order.getExpiresAt() == null || order.getExpiresAt().isBefore(LocalDateTime.now())) {
            order.setExpiresAt(LocalDateTime.now().plusMinutes(PAYMENT_EXPIRE_MINUTES));
            orderRepository.save(order);
        }

        Payment payment = Payment.builder()
                .order(order)
                .provider(PaymentProvider.VNPAY)
                .txnRef(order.getOrderCode() + "-" + System.currentTimeMillis())
                .amount(order.getTotalAmount())
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        String paymentUrl = vnPayService.buildPaymentUrl(order, payment, sanitizeIp(ipAddress));
        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(payment.getTxnRef())
                .expiresAt(order.getExpiresAt())
                .build();
    }

    private void markPaid(Order order, Payment payment, VnPayService.VnPayCallback callback) {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setResponseCode(callback.responseCode());
        payment.setTransactionNo(callback.transactionNo());
        payment.setBankCode(callback.bankCode());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.PAID);
        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setPaidAt(LocalDateTime.now());
        orderRepository.save(order);

        if (ORDER_TYPE_PREMIUM.equals(order.getOrderType())) {
            authEntitlementClient.activatePremium(order);
        }
    }

    private static boolean isSuccessfulPayment(VnPayService.VnPayCallback callback) {
        return "00".equals(callback.responseCode())
                && ("00".equals(callback.transactionStatus()) || callback.transactionStatus() == null
                || callback.transactionStatus().isBlank());
    }

    private static String resultStatus(VnPayService.VnPayCallback callback) {
        return "24".equals(callback.responseCode()) ? "cancelled" : "failed";
    }

    private void failPayment(Order order, Payment payment, VnPayService.VnPayCallback callback) {
        payment.setStatus(PaymentStatus.FAILED);
        payment.setResponseCode(callback.responseCode());
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.FAILED);
        if ("24".equals(callback.responseCode())) {
            order.setStatus(OrderStatus.CANCELLED);
        }
        orderRepository.save(order);
    }

    private Order requireOwnedOrder(Long userId, String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng."));
        if (!Objects.equals(order.getUserId(), userId)) {
            throw new NotFoundException("Không tìm thấy đơn hàng.");
        }
        return order;
    }

    private Map<Long, Integer> mergeItems(List<CreateOrderItemRequest> items) {
        Map<Long, Integer> result = new LinkedHashMap<>();
        for (CreateOrderItemRequest item : items) {
            int merged = result.getOrDefault(item.getProductId(), 0) + item.getQuantity();
            if (merged > 99) {
                throw new BadRequestException("Số lượng mỗi sản phẩm tối đa là 99.");
            }
            result.put(item.getProductId(), merged);
        }
        return result;
    }

    private String generateUniqueOrderCode() {
        LocalDateTime now = LocalDateTime.now();
        String prefix = String.format("SV-%04d%02d%02d-", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = prefix + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (!orderRepository.existsByOrderCode(code)) {
                return code;
            }
        }
        throw new ServiceUnavailableException("Không thể tạo mã đơn hàng. Vui lòng thử lại.");
    }

    private OrderResponse toResponse(Order order, String paymentUrl) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .orderType(order.getOrderType() == null ? ORDER_TYPE_PRODUCT : order.getOrderType())
                .premiumPackage(order.getPremiumPackage())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .receiverName(order.getReceiverName())
                .phone(order.getPhone())
                .address(order.getAddress())
                .note(order.getNote())
                .items(items)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .expiresAt(order.getExpiresAt())
                .paymentUrl(paymentUrl)
                .build();
    }

    private AdminOrderResponse toAdminResponse(Order order, boolean includePayments) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .build())
                .toList();

        List<AdminPaymentResponse> payments = includePayments
                ? paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                .map(payment -> AdminPaymentResponse.builder()
                        .id(payment.getId())
                        .provider(payment.getProvider().name())
                        .txnRef(payment.getTxnRef())
                        .amount(payment.getAmount())
                        .status(payment.getStatus().name())
                        .responseCode(payment.getResponseCode())
                        .transactionNo(payment.getTransactionNo())
                        .bankCode(payment.getBankCode())
                        .createdAt(payment.getCreatedAt())
                        .paidAt(payment.getPaidAt())
                        .build())
                .toList()
                : List.of();

        return AdminOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .orderType(order.getOrderType() == null ? ORDER_TYPE_PRODUCT : order.getOrderType())
                .premiumPackage(order.getPremiumPackage())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .receiverName(order.getReceiverName())
                .phone(order.getPhone())
                .address(order.getAddress())
                .note(order.getNote())
                .items(items)
                .payments(payments)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .expiresAt(order.getExpiresAt())
                .paidAt(order.getPaidAt())
                .build();
    }

    private static String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        String trimmed = key.trim();
        return trimmed.length() > 80 ? trimmed.substring(0, 80) : trimmed;
    }

    private static String sanitizeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "127.0.0.1";
        }
        String first = ipAddress.split(",")[0].trim();
        if (first.matches("^[0-9.]{7,15}$") || first.matches("^[0-9a-fA-F:.%]{2,45}$")) {
            return first;
        }
        return "127.0.0.1";
    }

    private static Map<String, String> ipnResponse(String code, String message) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("RspCode", code);
        response.put("Message", message);
        return response;
    }
}
