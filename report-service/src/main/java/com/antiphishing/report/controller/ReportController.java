package com.antiphishing.report.controller;

import com.antiphishing.report.dto.CreateReportRequest;
import com.antiphishing.report.dto.ReportResponse;
import com.antiphishing.report.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody CreateReportRequest request) {
        ReportResponse response = reportService.createReport(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }
}
