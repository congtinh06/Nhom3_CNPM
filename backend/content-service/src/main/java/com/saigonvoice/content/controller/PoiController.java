package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.AdminPoiDetailDto;
import com.saigonvoice.content.dto.AdminPoiListItemDto;
import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiInternalQrDto;
import com.saigonvoice.content.dto.PoiPublishStatusDto;
import com.saigonvoice.content.dto.PoiSummaryDto;
import com.saigonvoice.content.dto.UpdatePoiRequest;
import com.saigonvoice.content.service.PoiContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
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

    @GetMapping("/api/content/internal/pois/qr/{qrToken}")
    public ResponseEntity<PoiInternalQrDto> getInternalPoiByQrToken(@PathVariable String qrToken) {
        return ResponseEntity.ok(poiContentService.getInternalPoiByQrToken(qrToken));
    }

    @GetMapping("/api/content/admin/pois")
    public ResponseEntity<Page<AdminPoiListItemDto>> getAdminPois(
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long routeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String audioStatus,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(
                poiContentService.getAdminPois(zoneId, routeId, status, search, audioStatus, pageable));
    }

    @GetMapping("/api/content/admin/pois/{id}")
    public ResponseEntity<AdminPoiDetailDto> getAdminPoiDetail(@PathVariable Long id) {
        return ResponseEntity.ok(poiContentService.getAdminPoiDetail(id));
    }

    @PostMapping("/api/content/admin/pois")
    public ResponseEntity<PoiDetailDto> createPoi(@Valid @RequestBody CreatePoiRequest request) {
        PoiDetailDto created = poiContentService.createPoi(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/api/content/admin/pois/{id}")
    public ResponseEntity<AdminPoiDetailDto> updatePoi(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePoiRequest request) {
        return ResponseEntity.ok(poiContentService.updatePoi(id, request));
    }

    // Danh sách POI theo trạng thái gửi event (mặc định FAILED) để admin biết POI nào kẹt
    @GetMapping("/api/content/admin/pois/publish-status")
    public ResponseEntity<List<PoiPublishStatusDto>> getPublishStatuses(
            @RequestParam(defaultValue = "FAILED") String status) {
        return ResponseEntity.ok(poiContentService.getPublishStatuses(status));
    }

    @GetMapping("/api/content/admin/pois/{id}/publish-status")
    public ResponseEntity<PoiPublishStatusDto> getPublishStatus(@PathVariable Long id) {
        return ResponseEntity.ok(poiContentService.getPublishStatus(id));
    }

    @PostMapping("/api/content/admin/pois/{id}/republish")
    public ResponseEntity<PoiPublishStatusDto> republish(@PathVariable Long id) {
        return ResponseEntity.ok(poiContentService.republish(id));
    }
}
