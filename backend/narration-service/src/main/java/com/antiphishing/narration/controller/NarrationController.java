package com.antiphishing.narration.controller;

import com.antiphishing.narration.dto.NarrationRequest;
import com.antiphishing.narration.dto.NarrationResponse;
import com.antiphishing.narration.service.NarrationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/narrate")
public class NarrationController {

    private final NarrationService narrationService;

    public NarrationController(NarrationService narrationService) {
        this.narrationService = narrationService;
    }

    @PostMapping
    public ResponseEntity<NarrationResponse> narrate(@Valid @RequestBody NarrationRequest request) {
        return ResponseEntity.ok(narrationService.narrate(request));
    }
}
