package com.saigonvoice.order.controller;

import com.saigonvoice.order.config.InternalAuthFilter;
import com.saigonvoice.order.dto.CreateOrderRequest;
import com.saigonvoice.order.dto.CreatePremiumOrderRequest;
import com.saigonvoice.order.dto.OrderResponse;
import com.saigonvoice.order.dto.PaymentStatusResponse;
import com.saigonvoice.order.dto.PaymentUrlResponse;
import com.saigonvoice.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request,
            HttpServletRequest httpRequest) {
        OrderResponse response = orderService.createOrder(userId, idempotencyKey, request, clientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/premium")
    public ResponseEntity<OrderResponse> createPremiumOrder(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody(required = false) CreatePremiumOrderRequest request,
            HttpServletRequest httpRequest) {
        OrderResponse response = orderService.createPremiumOrder(
                userId, idempotencyKey, request, clientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId) {
        return ResponseEntity.ok(orderService.getMyOrders(userId));
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<OrderResponse> getOrder(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getOrder(userId, orderCode));
    }

    @GetMapping("/{orderCode}/payment-status")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getPaymentStatus(userId, orderCode));
    }

    @PostMapping("/{orderCode}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.cancelOrder(userId, orderCode));
    }

    @PostMapping("/{orderCode}/payments/vnpay")
    public ResponseEntity<PaymentUrlResponse> createVnPayPayment(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @PathVariable String orderCode,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(orderService.createVnPayPayment(userId, orderCode, clientIp(httpRequest)));
    }

    @PostMapping("/{orderCode}/pay/mock-confirm")
    public ResponseEntity<OrderResponse> confirmDemoTransfer(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @PathVariable String orderCode,
            @RequestParam(defaultValue = "SUCCESS") String outcome) {
        return ResponseEntity.ok(orderService.confirmDemoTransfer(userId, orderCode, outcome));
    }

    @PostMapping("/{orderCode}/extend-expiry")
    public ResponseEntity<OrderResponse> extendExpiry(
            @RequestAttribute(InternalAuthFilter.ATTRIBUTE_USER_ID) Long userId,
            @PathVariable String orderCode,
            @RequestParam(defaultValue = "15") int minutes) {
        return ResponseEntity.ok(orderService.extendExpiry(userId, orderCode, minutes));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Void> vnPayReturn(@RequestParam Map<String, String> params) {
        String redirectUrl = orderService.handleVnPayReturn(params);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
    }

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnPayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(orderService.handleVnPayIpn(params));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
