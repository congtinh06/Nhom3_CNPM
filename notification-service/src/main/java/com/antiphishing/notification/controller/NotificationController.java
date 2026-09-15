package com.antiphishing.notification.controller;

import com.antiphishing.notification.entity.NotificationLog;
import com.antiphishing.notification.repository.NotificationLogRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationLogRepository repository;

    public NotificationController(NotificationLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NotificationLog>> getAllLogs() {
        return ResponseEntity.ok(repository.findAll(Sort.by(Sort.Direction.DESC, "sentAt")));
    }

    @GetMapping("/report/{reportId}")
    public ResponseEntity<List<NotificationLog>> getLogsByReportId(@PathVariable Long reportId) {
        return ResponseEntity.ok(repository.findByReportIdOrderBySentAtDesc(reportId));
    }
}
