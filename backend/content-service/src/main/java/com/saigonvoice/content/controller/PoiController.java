package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiSummaryDto;
import com.saigonvoice.content.service.PoiContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PoiController {

    private final PoiContentService poiContentService;

    @GetMapping("/api/content/pois")
    public ResponseEntity<List<PoiSummaryDto>> getPois(@RequestParam(required = false) Long zoneId) {
        return ResponseEntity.ok(poiContentService.getPois(zoneId));
    }

    @GetMapping("/api/content/pois/{id}")
    public ResponseEntity<PoiDetailDto> getPoiDetail(
            @PathVariable Long id,
            @RequestParam(defaultValue = "vi") String lang) {
        return ResponseEntity.ok(poiContentService.getPoiDetail(id, lang));
    }

    @GetMapping("/api/content/pois/qr/{qrToken}")
    public ResponseEntity<PoiDetailDto> getPoiByQrToken(
            @PathVariable String qrToken,
            @RequestParam(defaultValue = "vi") String lang) {
        return ResponseEntity.ok(poiContentService.getPoiByQrToken(qrToken, lang));
    }

    @GetMapping("/api/content/internal/pois/bounding-box")
    public ResponseEntity<List<PoiBoundingBoxDto>> getPoisInBoundingBox(
            @RequestParam(required = false) Long zoneId,
            @RequestParam BigDecimal minLat,
            @RequestParam BigDecimal maxLat,
            @RequestParam BigDecimal minLng,
            @RequestParam BigDecimal maxLng) {
        return ResponseEntity.ok(poiContentService.getPoisInBoundingBox(zoneId, minLat, maxLat, minLng, maxLng));
    }

    @PostMapping("/api/content/admin/pois")
    public ResponseEntity<PoiDetailDto> createPoi(@Valid @RequestBody CreatePoiRequest request) {
        PoiDetailDto created = poiContentService.createPoi(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
