package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.dto.CreateReportRequest;
import com.saigonvoice.analytics.dto.ReportResponse;

import java.util.List;

public interface ReportService {
    ReportResponse createReport(CreateReportRequest request);
    List<ReportResponse> getAllReports();
    ReportResponse getReportById(Long id);
}
