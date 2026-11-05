package com.echora.order.service;

import com.echora.order.dto.CreateOrderItemRequest;
import com.echora.order.dto.CreateOrderRequest;
import com.echora.order.dto.OrderResponse;
import com.echora.order.dto.ProductPrice;
import com.echora.order.entity.Order;
import com.echora.order.entity.PaymentMethod;
import com.echora.order.repository.OrderRepository;
import com.echora.order.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServicePremiumDiscountTest {

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

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "shippingFee", new BigDecimal("20000"));
        ReflectionTestUtils.setField(orderService, "freeShippingThreshold", new BigDecimal("50000"));
        ReflectionTestUtils.setField(orderService, "premiumPrice", new BigDecimal("500000"));
        ReflectionTestUtils.setField(orderService, "poiDefaultPrice", new BigDecimal("20000"));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.existsByOrderCode(anyString())).thenReturn(false);
    }

    @Test
    void premiumMemberGetsTenPercentOffSouvenirsAndShippingUsesDiscountedSubtotal() {
        ProductPrice souvenir = product(1L, "55000", "SOUVENIR");
        when(productPriceClient.fetchPrices(any())).thenReturn(Map.of(1L, souvenir));
        when(authEntitlementClient.isEligibleForSouvenirDiscount(7L)).thenReturn(true);

        OrderResponse response = orderService.createOrder(
                7L, null, orderRequest(item(1L, 1)), "127.0.0.1");

        assertThat(response.getSubtotal()).isEqualByComparingTo("55000");
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("5500");
        assertThat(response.getShippingFee()).isEqualByComparingTo("20000");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("69500");
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getUnitPrice()).isEqualByComparingTo("55000");
        verify(authEntitlementClient).isEligibleForSouvenirDiscount(7L);
    }

    @Test
    void nonPremiumMemberPaysFullPrice() {
        ProductPrice souvenir = product(1L, "55000", "SOUVENIR");
        when(productPriceClient.fetchPrices(any())).thenReturn(Map.of(1L, souvenir));
        when(authEntitlementClient.isEligibleForSouvenirDiscount(7L)).thenReturn(false);

        OrderResponse response = orderService.createOrder(
                7L, null, orderRequest(item(1L, 1)), "127.0.0.1");

        assertThat(response.getSubtotal()).isEqualByComparingTo("55000");
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("0");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("55000");
    }

    @Test
    void discountDoesNotApplyToFoodOrDrinks() {
        ProductPrice food = product(2L, "30000", "FOOD");
        when(productPriceClient.fetchPrices(any())).thenReturn(Map.of(2L, food));

        OrderResponse response = orderService.createOrder(
                7L, null, orderRequest(item(2L, 1)), "127.0.0.1");

        assertThat(response.getSubtotal()).isEqualByComparingTo("30000");
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("0");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("50000");
        verify(authEntitlementClient, never()).isEligibleForSouvenirDiscount(any());
    }

    @Test
    void entitlementLookupFailureDoesNotBlockCheckout() {
        ProductPrice souvenir = product(3L, "70000", "SOUVENIR");
        when(productPriceClient.fetchPrices(any())).thenReturn(Map.of(3L, souvenir));
        when(authEntitlementClient.isEligibleForSouvenirDiscount(7L)).thenReturn(false);

        OrderResponse response = orderService.createOrder(
                7L, null, orderRequest(item(3L, 1)), "127.0.0.1");

        assertThat(response.getDiscountAmount()).isEqualByComparingTo("0");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("70000");
    }

    private static CreateOrderRequest orderRequest(CreateOrderItemRequest item) {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setReceiverName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setAddress("1 Nguyen Hue, Quan 1");
        request.setPaymentMethod(PaymentMethod.COD);
        request.setItems(List.of(item));
        return request;
    }

    private static CreateOrderItemRequest item(Long productId, int quantity) {
        return new CreateOrderItemRequest(productId, quantity);
    }

    private static ProductPrice product(Long id, String price, String category) {
        return new ProductPrice(id, "Product " + id, new BigDecimal(price), true, category);
    }
}
