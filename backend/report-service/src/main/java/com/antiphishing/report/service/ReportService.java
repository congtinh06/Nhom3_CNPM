package com.antiphishing.report.service;

import com.antiphishing.report.dto.CreateReportRequest;
import com.antiphishing.report.dto.ReportResponse;

import java.util.List;

public interface ReportService {
    ReportResponse createReport(CreateReportRequest request);
    List<ReportResponse> getAllReports();
    ReportResponse getReportById(Long id);
}
