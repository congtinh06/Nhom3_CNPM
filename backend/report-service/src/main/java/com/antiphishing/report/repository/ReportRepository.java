package com.antiphishing.report.repository;

import com.antiphishing.report.entity.Report;
import com.antiphishing.report.entity.ReportChannel;
import com.antiphishing.report.entity.ReportStatus;
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
