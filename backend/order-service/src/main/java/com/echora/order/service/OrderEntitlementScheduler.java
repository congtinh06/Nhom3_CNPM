package com.echora.order.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEntitlementScheduler {

    private final OrderEntitlementService entitlementService;

    @Scheduled(
            fixedDelayString = "${app.entitlement.retry-delay-ms:2000}",
            initialDelayString = "${app.entitlement.retry-initial-delay-ms:2000}")
    public void retryDueGrants() {
        for (var grant : entitlementService.findDueGrants()) {
            try {
                entitlementService.grantOne(grant.getId());
            } catch (RuntimeException ex) {
                log.warn("Khong xu ly duoc grant id={} orderCode={}: {}",
                        grant.getId(), grant.getOrderCode(), ex.getMessage());
            }
        }
    }
}
