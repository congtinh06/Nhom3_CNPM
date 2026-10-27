package com.echora.order.service;

import com.echora.order.entity.Order;
import com.echora.order.entity.OrderEntitlementGrant;
import com.echora.order.entity.OrderEntitlementGrantStatus;
import com.echora.order.entity.PaymentStatus;
import com.echora.order.exception.EntitlementGrantException;
import com.echora.order.exception.ServiceUnavailableException;
import com.echora.order.repository.OrderEntitlementGrantRepository;
import com.echora.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEntitlementService {

    private static final int MAX_ATTEMPTS = 8;

    private final OrderRepository orderRepository;
    private final OrderEntitlementGrantRepository grantRepository;
    private final AuthEntitlementClient authEntitlementClient;

    /** Ghi outbox trong cung transaction voi trang thai thanh toan. */
    @Transactional
    public void enqueue(Order order) {
        if (!isDigitalOrder(order) || order.getId() == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        grantRepository.insertIfAbsent(
                order.getId(),
                order.getOrderCode(),
                order.getUserId(),
                order.getOrderType(),
                order.getPoiId(),
                now);
    }

    @Transactional(readOnly = true)
    public List<OrderEntitlementGrant> findDueGrants() {
        return grantRepository
                .findTop20ByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
                        OrderEntitlementGrantStatus.PENDING,
                        LocalDateTime.now());
    }

    /**
     * Xu ly mot grant trong transaction rieng. Loi auth-service chi cap nhat outbox,
     * khong lam rollback payment/order.
     */
    @Transactional
    public void grantOne(Long grantId) {
        OrderEntitlementGrant grant = grantRepository.findById(grantId).orElse(null);
        if (grant == null || grant.getStatus() == OrderEntitlementGrantStatus.GRANTED) {
            return;
        }

        Order order = orderRepository.findById(grant.getOrderId()).orElse(null);
        if (order == null) {
            fail(grant, "Khong tim thay don hang.");
            return;
        }
        if (!isDigitalOrder(order)) {
            fail(grant, "Don hang khong can cap quyen so.");
            return;
        }
        if (order.getPaymentStatus() != PaymentStatus.SUCCESS) {
            scheduleRetry(grant, "Don hang chua thanh toan.");
            return;
        }

        try {
            if (OrderService.ORDER_TYPE_POI.equals(order.getOrderType())) {
                authEntitlementClient.grantPoiAccess(order);
            } else {
                authEntitlementClient.activatePremium(order);
            }
            grant.setStatus(OrderEntitlementGrantStatus.GRANTED);
            grant.setGrantedAt(LocalDateTime.now());
            grant.setLastError(null);
            grant.setNextAttemptAt(null);
            grantRepository.save(grant);
            log.info("Da cap quyen {} cho orderCode={} userId={}",
                    order.getOrderType(), order.getOrderCode(), order.getUserId());
        } catch (EntitlementGrantException ex) {
            fail(grant, ex.getMessage());
        } catch (ServiceUnavailableException ex) {
            scheduleRetry(grant, ex.getMessage());
        } catch (RuntimeException ex) {
            scheduleRetry(grant, ex.getMessage());
        }
    }

    /** Admin reset mot grant de scheduler thu lai ngay. */
    @Transactional
    public void retryNow(Order order) {
        enqueue(order);
        OrderEntitlementGrant grant = grantRepository.findByOrderId(order.getId()).orElse(null);
        if (grant == null) {
            return;
        }
        grant.setStatus(OrderEntitlementGrantStatus.PENDING);
        grant.setAttempts(0);
        grant.setLastError(null);
        grant.setNextAttemptAt(LocalDateTime.now());
        grantRepository.save(grant);
    }

    private void scheduleRetry(OrderEntitlementGrant grant, String message) {
        int attempts = grant.getAttempts() + 1;
        grant.setAttempts(attempts);
        grant.setLastError(trim(message));
        if (attempts >= MAX_ATTEMPTS) {
            grant.setStatus(OrderEntitlementGrantStatus.FAILED);
            grant.setNextAttemptAt(null);
            log.error("Cap quyen that bai sau {} lan cho orderCode={}: {}",
                    attempts, grant.getOrderCode(), message);
            return;
        }
        long delaySeconds = Math.min(300, 5L * (1L << Math.min(attempts - 1, 6)));
        grant.setStatus(OrderEntitlementGrantStatus.PENDING);
        grant.setNextAttemptAt(LocalDateTime.now().plusSeconds(delaySeconds));
        log.warn("Se thu lai cap quyen cho orderCode={} sau {}s (lan {}): {}",
                grant.getOrderCode(), delaySeconds, attempts, message);
    }

    private void fail(OrderEntitlementGrant grant, String message) {
        grant.setStatus(OrderEntitlementGrantStatus.FAILED);
        grant.setLastError(trim(message));
        grant.setNextAttemptAt(null);
        log.error("Khong the cap quyen cho orderCode={}: {}", grant.getOrderCode(), message);
    }

    private static boolean isDigitalOrder(Order order) {
        return OrderService.ORDER_TYPE_PREMIUM.equals(order.getOrderType())
                || OrderService.ORDER_TYPE_POI.equals(order.getOrderType());
    }

    private static String trim(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= 500 ? message : message.substring(0, 500);
    }
}
