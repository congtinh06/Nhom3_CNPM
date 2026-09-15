package com.antiphishing.linkverification.controller;

import com.antiphishing.linkverification.dto.VerifyRequest;
import com.antiphishing.linkverification.dto.VerifyResponse;
import com.antiphishing.linkverification.service.VerificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class VerificationController {

    private final VerificationService service;

    public VerificationController(VerificationService service) {
        this.service = service;
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(@Valid @RequestBody VerifyRequest request) {
        return ResponseEntity.ok(service.verify(request));
    }
}
