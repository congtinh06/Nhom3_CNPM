package com.echora.order.controller;

import com.echora.order.dto.AdminOrderResponse;
import com.echora.order.dto.UpdateOrderStatusRequest;
import com.echora.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<Page<AdminOrderResponse>> listOrders(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                orderService.getAdminOrders(type, status, paymentStatus, search, page, size));
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<AdminOrderResponse> getOrder(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getAdminOrder(orderCode));
    }

    @PatchMapping("/{orderCode}/status")
    public ResponseEntity<AdminOrderResponse> updateStatus(
            @PathVariable String orderCode,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderCode, request.getStatus()));
    }

    @PostMapping("/{orderCode}/confirm-payment")
    public ResponseEntity<AdminOrderResponse> confirmPayment(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.confirmPayment(orderCode));
    }

    @PostMapping("/{orderCode}/reject-payment")
    public ResponseEntity<AdminOrderResponse> rejectPayment(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.rejectPayment(orderCode));
    }

    @PostMapping("/{orderCode}/retry-entitlement")
    public ResponseEntity<AdminOrderResponse> retryEntitlement(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.retryEntitlement(orderCode));
    }
}
