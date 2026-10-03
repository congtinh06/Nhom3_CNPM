package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.ZoneDto;
import com.saigonvoice.content.service.ZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content/zones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping
    public ResponseEntity<List<ZoneDto>> getAllZones() {
        return ResponseEntity.ok(zoneService.getAllActiveZones());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZoneDto> getZoneById(@PathVariable Long id) {
        return ResponseEntity.ok(zoneService.getZoneById(id));
    }
}
