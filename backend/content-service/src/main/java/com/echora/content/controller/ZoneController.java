package com.echora.content.controller;

import com.echora.content.dto.AdminZoneDetailDto;
import com.echora.content.dto.AdminZoneListItemDto;
import com.echora.content.dto.CreateZoneRequest;
import com.echora.content.dto.UpdateStatusRequest;
import com.echora.content.dto.UpdateZoneRequest;
import com.echora.content.dto.ZoneDto;
import com.echora.content.service.ZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
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

    @GetMapping("/api/content/admin/zones")
    public ResponseEntity<Page<AdminZoneListItemDto>> getAdminZones(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(zoneService.getAdminZones(search, isActive, pageable));
    }

    @GetMapping("/api/content/admin/zones/{id}")
    public ResponseEntity<AdminZoneDetailDto> getAdminZoneDetail(@PathVariable Long id) {
        return ResponseEntity.ok(zoneService.getAdminZoneDetail(id));
    }

    @PostMapping("/api/content/admin/zones")
    public ResponseEntity<ZoneDto> createZone(@Valid @RequestBody CreateZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zoneService.createZone(request));
    }

    @PutMapping("/api/content/admin/zones/{id}")
    public ResponseEntity<ZoneDto> updateZone(@PathVariable Long id,
                                               @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(zoneService.updateZone(id, request));
    }

    @RequestMapping(value = "/api/content/admin/zones/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AdminZoneDetailDto> updateZoneStatus(@PathVariable Long id,
                                                               @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(zoneService.updateStatus(id, request.getIsActive()));
    }
}
