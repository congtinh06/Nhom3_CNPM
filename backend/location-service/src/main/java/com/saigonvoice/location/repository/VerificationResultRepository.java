package com.saigonvoice.location.repository;

import com.saigonvoice.location.entity.VerificationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationResultRepository extends JpaRepository<VerificationResult, Long> {
    List<VerificationResult> findByDomainOrderByCheckedAtDesc(String domain);
}
