package com.saigonvoice.analytics.repository;

import com.saigonvoice.analytics.entity.Report;
import com.saigonvoice.analytics.entity.ReportChannel;
import com.saigonvoice.analytics.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDesc();
    List<Report> findByStatus(ReportStatus status);

    long countByIsPhishing(Boolean isPhishing);
    long countByChannel(ReportChannel channel);
    long countByChannelAndIsPhishing(ReportChannel channel, Boolean isPhishing);
}
