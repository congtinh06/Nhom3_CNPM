package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.CreateZoneRequest;
import com.saigonvoice.content.dto.ZoneDto;
import com.saigonvoice.content.service.ZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping("/api/content/zones")
    public ResponseEntity<List<ZoneDto>> getAllZones() {
        return ResponseEntity.ok(zoneService.getAllActiveZones());
    }

    @GetMapping("/api/content/zones/{id}")
    public ResponseEntity<ZoneDto> getZoneById(@PathVariable Long id) {
        return ResponseEntity.ok(zoneService.getZoneById(id));
    }

    @PostMapping("/api/content/admin/zones")
    public ResponseEntity<ZoneDto> createZone(@Valid @RequestBody CreateZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zoneService.createZone(request));
    }

    @PutMapping("/api/content/admin/zones/{id}")
    public ResponseEntity<ZoneDto> updateZone(@PathVariable Long id,
                                              @Valid @RequestBody com.saigonvoice.content.dto.UpdateZoneRequest request) {
        return ResponseEntity.ok(zoneService.updateZone(id, request));
    }
}
