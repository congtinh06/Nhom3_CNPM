package com.echora.order.service;

import com.echora.order.dto.CreateOrderItemRequest;
import com.echora.order.dto.CreateOrderRequest;
import com.echora.order.dto.CreatePoiOrderRequest;
import com.echora.order.dto.CreatePremiumOrderRequest;
import com.echora.order.dto.OrderResponse;
import com.echora.order.dto.ProductPrice;
import com.echora.order.entity.Order;
import com.echora.order.entity.OrderStatus;
import com.echora.order.entity.Payment;
import com.echora.order.entity.PaymentMethod;
import com.echora.order.entity.PaymentStatus;
import com.echora.order.exception.BadRequestException;
import com.echora.order.exception.ForbiddenException;
import com.echora.order.exception.NotFoundException;
import com.echora.order.exception.ServiceUnavailableException;
import com.echora.order.repository.OrderRepository;
import com.echora.order.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ProductPriceClient productPriceClient;

    @Mock
    private PoiPriceClient poiPriceClient;

    @Mock
    private OrderEntitlementService orderEntitlementService;

    @Mock
    private AuthEntitlementClient authEntitlementClient;

    @Mock
    private VnPayService vnPayService;

    @InjectMocks
    private OrderService orderService;

    private static final Long USER_ID = 100L;
    private static final String ORDER_CODE = "ECHORA2026103112345678";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "shippingFee", new BigDecimal("20000"));
        ReflectionTestUtils.setField(orderService, "freeShippingThreshold", new BigDecimal("50000"));
        ReflectionTestUtils.setField(orderService, "mockEnabled", true);
        ReflectionTestUtils.setField(orderService, "premiumPrice", new BigDecimal("500000"));
        ReflectionTestUtils.setField(orderService, "poiDefaultPrice", new BigDecimal("100000"));
    }

    private CreateOrderRequest buildSampleOrderRequest(PaymentMethod paymentMethod) {
        CreateOrderItemRequest item = new CreateOrderItemRequest();
        item.setProductId(1L);
        item.setQuantity(2);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setReceiverName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setAddress("123 Le Loi, Quan 1, TP.HCM");
        request.setNote("Giao gio hanh chinh");
        request.setPaymentMethod(paymentMethod);
        request.setItems(List.of(item));
        return request;
    }

    private ProductPrice buildProductPrice(Long id, String price, String category) {
        ProductPrice p = new ProductPrice();
        p.setId(id);
        p.setPrice(new BigDecimal(price));
        p.setName("Mo hinh Dinh Doc Lap");
        p.setCategory(category);
        p.setIsActive(true);
        return p;
    }

    @Test
    @DisplayName("createOrder: creates standard order with subtotal, shipping and total")
    void createOrder_Success() {
        CreateOrderRequest request = buildSampleOrderRequest(PaymentMethod.COD);
        ProductPrice price = buildProductPrice(1L, "15000", "SOUVENIR");

        when(orderRepository.existsByOrderCode(anyString())).thenReturn(false);
        when(productPriceClient.fetchPrices(any())).thenReturn(Map.of(1L, price));
        when(authEntitlementClient.isEligibleForSouvenirDiscount(USER_ID)).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.createOrder(USER_ID, null, request, "127.0.0.1");

        assertThat(response).isNotNull();
        assertThat(response.getReceiverName()).isEqualTo("Nguyen Van A");
        assertThat(response.getPhone()).isEqualTo("0901234567");
        assertThat(response.getSubtotal()).isEqualByComparingTo("30000"); // 15000 * 2
        assertThat(response.getShippingFee()).isEqualByComparingTo("20000"); // < 50000 threshold
        assertThat(response.getTotalAmount()).isEqualByComparingTo("50000");
        assertThat(response.getStatus()).isEqualTo("PROCESSING");
        assertThat(response.getPaymentStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("createOrder: returns existing order when idempotency key is matched")
    void createOrder_IdempotencyKeyReturnsExisting() {
        CreateOrderRequest request = buildSampleOrderRequest(PaymentMethod.COD);
        Order existing = Order.builder()
                .id(1L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .receiverName("Existing")
                .phone("0901234567")
                .address("123 Le Loi")
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING_PAYMENT)
                .subtotal(new BigDecimal("30000"))
                .shippingFee(new BigDecimal("20000"))
                .totalAmount(new BigDecimal("50000"))
                .items(Collections.emptyList())
                .build();

        when(orderRepository.findByUserIdAndIdempotencyKey(USER_ID, "KEY_123")).thenReturn(Optional.of(existing));

        OrderResponse response = orderService.createOrder(USER_ID, "KEY_123", request, "127.0.0.1");

        assertThat(response.getOrderCode()).isEqualTo(ORDER_CODE);
        verify(productPriceClient, never()).fetchPrices(any());
    }

    @Test
    @DisplayName("createOrder: throws ServiceUnavailableException when VNPAY payment method is selected without merchant configuration")
    void createOrder_ThrowsWhenVnPayUnconfigured() {
        CreateOrderRequest request = buildSampleOrderRequest(PaymentMethod.VNPAY);
        when(vnPayService.isConfigured()).thenReturn(false);

        assertThatThrownBy(() -> orderService.createOrder(USER_ID, null, request, "127.0.0.1"))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Cổng thanh toán VNPAY chưa được cấu hình");
    }

    @Test
    @DisplayName("createOrder: free shipping applied when subtotal >= threshold")
    void createOrder_FreeShippingApplied() {
        CreateOrderRequest request = buildSampleOrderRequest(PaymentMethod.COD);
        ProductPrice price = buildProductPrice(1L, "30000", "SOUVENIR");

        when(orderRepository.existsByOrderCode(anyString())).thenReturn(false);
        when(productPriceClient.fetchPrices(any())).thenReturn(Map.of(1L, price));
        when(authEntitlementClient.isEligibleForSouvenirDiscount(USER_ID)).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.createOrder(USER_ID, null, request, "127.0.0.1");

        assertThat(response.getSubtotal()).isEqualByComparingTo("60000"); // 30000 * 2 >= 50000 threshold
        assertThat(response.getShippingFee()).isEqualByComparingTo("0");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("60000");
    }

    @Test
    @DisplayName("cancelOrder: cancels pending order and marks pending payments failed")
    void cancelOrder_SuccessWhenPending() {
        Order order = Order.builder()
                .id(1L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .paymentMethod(PaymentMethod.COD)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .items(Collections.emptyList())
                .build();

        Payment payment = Payment.builder()
                .id(10L)
                .order(order)
                .status(PaymentStatus.PENDING)
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderIdAndStatus(1L, PaymentStatus.PENDING)).thenReturn(List.of(payment));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.cancelOrder(USER_ID, ORDER_CODE);

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(response.getPaymentStatus()).isEqualTo("FAILED");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("cancelOrder: throws BadRequestException when order is already completed or cancelled")
    void cancelOrder_ThrowsWhenNonCancellable() {
        Order order = Order.builder()
                .id(1L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .status(OrderStatus.COMPLETED)
                .paymentStatus(PaymentStatus.SUCCESS)
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(USER_ID, ORDER_CODE))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Đơn hàng không thể hủy");
    }

    @Test
    @DisplayName("cancelOrder: throws NotFoundException when requesting user does not own order")
    void cancelOrder_ThrowsWhenNotOwner() {
        Order order = Order.builder()
                .id(1L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .status(OrderStatus.PENDING_PAYMENT)
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(999L, ORDER_CODE))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Không tìm thấy đơn hàng");
    }

    @Test
    @DisplayName("cancelOrder: throws NotFoundException when order code does not exist")
    void cancelOrder_ThrowsWhenNotFound() {
        when(orderRepository.findByOrderCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.cancelOrder(USER_ID, "UNKNOWN"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Không tìm thấy đơn hàng");
    }

    @Test
    @DisplayName("confirmDemoTransfer: SUCCESS outcome marks order PAID and enqueues entitlement")
    void confirmDemoTransfer_SuccessOutcome() {
        Order order = Order.builder()
                .id(2L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .paymentMethod(PaymentMethod.VIETQR)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .items(Collections.emptyList())
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.confirmDemoTransfer(USER_ID, ORDER_CODE, "SUCCESS");

        assertThat(response.getStatus()).isEqualTo("PAID");
        assertThat(response.getPaymentStatus()).isEqualTo("SUCCESS");
        verify(orderEntitlementService).enqueue(order);
    }

    @Test
    @DisplayName("confirmDemoTransfer: FAILED outcome marks payment FAILED without entitlement")
    void confirmDemoTransfer_FailedOutcome() {
        Order order = Order.builder()
                .id(2L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .paymentMethod(PaymentMethod.VIETQR)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .items(Collections.emptyList())
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.confirmDemoTransfer(USER_ID, ORDER_CODE, "FAILED");

        assertThat(response.getPaymentStatus()).isEqualTo("FAILED");
        assertThat(response.getStatus()).isEqualTo("PENDING_PAYMENT");
        verify(orderEntitlementService, never()).enqueue(any());
    }

    @Test
    @DisplayName("confirmDemoTransfer: throws BadRequestException when order payment method is not VietQR")
    void confirmDemoTransfer_ThrowsWhenNotVietQr() {
        Order order = Order.builder()
                .id(2L)
                .orderCode(ORDER_CODE)
                .userId(USER_ID)
                .paymentMethod(PaymentMethod.COD)
                .status(OrderStatus.PENDING_PAYMENT)
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.confirmDemoTransfer(USER_ID, ORDER_CODE, "SUCCESS"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Đơn hàng không dùng phương thức VietQR");
    }

    @Test
    @DisplayName("confirmDemoTransfer: throws ForbiddenException when mockEnabled is false")
    void confirmDemoTransfer_ThrowsWhenMockDisabled() {
        ReflectionTestUtils.setField(orderService, "mockEnabled", false);

        assertThatThrownBy(() -> orderService.confirmDemoTransfer(USER_ID, ORDER_CODE, "SUCCESS"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Chức năng xác nhận chuyển khoản demo đang tắt");
    }

    @Test
    @DisplayName("createPremiumOrder: throws BadRequestException when package code is invalid")
    void createPremiumOrder_ThrowsWhenInvalidPackage() {
        CreatePremiumOrderRequest req = new CreatePremiumOrderRequest();
        req.setPackageCode("INVALID_PACKAGE");

        assertThatThrownBy(() -> orderService.createPremiumOrder(USER_ID, null, req, "127.0.0.1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Goi Premium khong hop le");
    }

    @Test
    @DisplayName("createPoiOrder: throws BadRequestException when poiId is missing")
    void createPoiOrder_ThrowsWhenPoiIdNull() {
        CreatePoiOrderRequest req = new CreatePoiOrderRequest();
        req.setPoiId(null);

        assertThatThrownBy(() -> orderService.createPoiOrder(USER_ID, null, req, "127.0.0.1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Điểm thuyết minh không hợp lệ");
    }

    @Test
    @DisplayName("adminConfirmPayment: transitions order to PAID and enqueues entitlement")
    void adminConfirmPayment_Success() {
        Order order = Order.builder()
                .id(5L)
                .orderCode(ORDER_CODE)
                .paymentMethod(PaymentMethod.COD)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .items(Collections.emptyList())
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = orderService.confirmPayment(ORDER_CODE);

        assertThat(response.getStatus()).isEqualTo("PAID");
        assertThat(response.getPaymentStatus()).isEqualTo("SUCCESS");
        verify(orderEntitlementService).enqueue(order);
    }

    @Test
    @DisplayName("adminConfirmPayment: throws BadRequestException when order is cancelled")
    void adminConfirmPayment_ThrowsWhenCancelled() {
        Order order = Order.builder()
                .id(5L)
                .orderCode(ORDER_CODE)
                .status(OrderStatus.CANCELLED)
                .paymentStatus(PaymentStatus.FAILED)
                .build();

        when(orderRepository.findByOrderCode(ORDER_CODE)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.confirmPayment(ORDER_CODE))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Đơn hàng đã hủy, không thể xác nhận thanh toán");
    }
}
