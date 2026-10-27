package com.echora.order.service;

import com.echora.order.entity.Order;
import com.echora.order.entity.OrderEntitlementGrant;
import com.echora.order.entity.OrderEntitlementGrantStatus;
import com.echora.order.entity.PaymentStatus;
import com.echora.order.exception.ServiceUnavailableException;
import com.echora.order.repository.OrderEntitlementGrantRepository;
import com.echora.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderEntitlementServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderEntitlementGrantRepository grantRepository;

    @Mock
    private AuthEntitlementClient authEntitlementClient;

    @InjectMocks
    private OrderEntitlementService entitlementService;

    @Test
    void enqueueWritesDigitalOrderToOutbox() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_PREMIUM);

        entitlementService.enqueue(order);

        verify(grantRepository).insertIfAbsent(
                eq(order.getId()),
                eq(order.getOrderCode()),
                eq(order.getUserId()),
                eq(OrderService.ORDER_TYPE_PREMIUM),
                eq(order.getPoiId()),
                any(LocalDateTime.class));
    }

    @Test
    void enqueueIgnoresProductOrders() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_PRODUCT);

        entitlementService.enqueue(order);

        verify(grantRepository, never()).insertIfAbsent(
                any(), any(), any(), any(), any(), any());
    }

    @Test
    void grantOneActivatesPremiumAndMarksGranted() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_PREMIUM);
        OrderEntitlementGrant grant = pendingGrant(order);
        when(grantRepository.findById(10L)).thenReturn(Optional.of(grant));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        entitlementService.grantOne(10L);

        verify(authEntitlementClient).activatePremium(order);
        verify(grantRepository).save(grant);
        assertThat(grant.getStatus()).isEqualTo(OrderEntitlementGrantStatus.GRANTED);
        assertThat(grant.getGrantedAt()).isNotNull();
        assertThat(grant.getLastError()).isNull();
        assertThat(grant.getNextAttemptAt()).isNull();
    }

    @Test
    void grantOneGrantsPoiAccessForPoiOrder() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_POI);
        OrderEntitlementGrant grant = pendingGrant(order);
        when(grantRepository.findById(10L)).thenReturn(Optional.of(grant));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        entitlementService.grantOne(10L);

        verify(authEntitlementClient).grantPoiAccess(order);
        assertThat(grant.getStatus()).isEqualTo(OrderEntitlementGrantStatus.GRANTED);
    }

    @Test
    void grantOneSchedulesRetryWhenAuthServiceIsUnavailable() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_PREMIUM);
        OrderEntitlementGrant grant = pendingGrant(order);
        grant.setAttempts(2);
        when(grantRepository.findById(10L)).thenReturn(Optional.of(grant));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        org.mockito.Mockito.doThrow(new ServiceUnavailableException("temporarily down"))
                .when(authEntitlementClient).activatePremium(order);

        entitlementService.grantOne(10L);

        assertThat(grant.getStatus()).isEqualTo(OrderEntitlementGrantStatus.PENDING);
        assertThat(grant.getAttempts()).isEqualTo(3);
        assertThat(grant.getNextAttemptAt()).isAfter(LocalDateTime.now());
        assertThat(grant.getLastError()).isEqualTo("temporarily down");
    }

    @Test
    void grantOneMarksFailedAfterMaxAttempts() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_PREMIUM);
        OrderEntitlementGrant grant = pendingGrant(order);
        grant.setAttempts(7);
        when(grantRepository.findById(10L)).thenReturn(Optional.of(grant));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        org.mockito.Mockito.doThrow(new ServiceUnavailableException("temporarily down"))
                .when(authEntitlementClient).activatePremium(order);

        entitlementService.grantOne(10L);

        assertThat(grant.getStatus()).isEqualTo(OrderEntitlementGrantStatus.FAILED);
        assertThat(grant.getAttempts()).isEqualTo(8);
        assertThat(grant.getNextAttemptAt()).isNull();
    }

    @Test
    void retryNowResetsFailedGrant() {
        Order order = digitalOrder(OrderService.ORDER_TYPE_POI);
        OrderEntitlementGrant grant = pendingGrant(order);
        grant.setStatus(OrderEntitlementGrantStatus.FAILED);
        grant.setAttempts(8);
        grant.setLastError("down");
        when(grantRepository.findByOrderId(1L)).thenReturn(Optional.of(grant));

        entitlementService.retryNow(order);

        verify(grantRepository).insertIfAbsent(
                eq(1L), eq("ORDER-1"), eq(7L), eq(OrderService.ORDER_TYPE_POI), eq(42L), any());
        verify(grantRepository).save(grant);
        assertThat(grant.getStatus()).isEqualTo(OrderEntitlementGrantStatus.PENDING);
        assertThat(grant.getAttempts()).isZero();
        assertThat(grant.getLastError()).isNull();
        assertThat(grant.getNextAttemptAt()).isNotNull();
    }

    private static Order digitalOrder(String orderType) {
        return Order.builder()
                .id(1L)
                .orderCode("ORDER-1")
                .userId(7L)
                .orderType(orderType)
                .poiId(OrderService.ORDER_TYPE_POI.equals(orderType) ? 42L : null)
                .paymentStatus(PaymentStatus.SUCCESS)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();
    }

    private static OrderEntitlementGrant pendingGrant(Order order) {
        return OrderEntitlementGrant.builder()
                .id(10L)
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .orderType(order.getOrderType())
                .poiId(order.getPoiId())
                .status(OrderEntitlementGrantStatus.PENDING)
                .attempts(0)
                .build();
    }
}
