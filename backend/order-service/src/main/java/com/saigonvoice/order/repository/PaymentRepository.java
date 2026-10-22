package com.saigonvoice.order.repository;

import com.saigonvoice.order.entity.Payment;
import com.saigonvoice.order.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTxnRef(String txnRef);

    List<Payment> findByOrderIdAndStatus(Long orderId, PaymentStatus status);

    List<Payment> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
