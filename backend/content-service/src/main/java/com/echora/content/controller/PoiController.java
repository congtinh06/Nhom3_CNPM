package com.echora.content.controller;

import com.echora.content.dto.AdminAudioStatusDto;
import com.echora.content.dto.AdminPoiDetailDto;
import com.echora.content.dto.AdminPoiListItemDto;
import com.echora.content.dto.AudioRegenerationBatchDto;
import com.echora.content.dto.AudioRegenerationResultDto;
import com.echora.content.dto.CreatePoiRequest;
import com.echora.content.dto.PoiBoundingBoxDto;
import com.echora.content.dto.PoiDetailDto;
import com.echora.content.dto.PoiGuideDto;
import com.echora.content.dto.PoiInternalQrDto;
import com.echora.content.dto.PoiPremiumPriceDto;
import com.echora.content.dto.PoiPublishStatusDto;
import com.echora.content.dto.PoiSummaryDto;
import com.echora.content.dto.UpdatePoiRequest;
import com.echora.content.dto.UpdatePoiStatusRequest;
import com.echora.content.service.PoiContentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@Validated
public class PoiController {

    private final PoiContentService poiContentService;

    @GetMapping("/api/content/pois")
    public ResponseEntity<List<PoiSummaryDto>> getPois(@RequestParam(required = false) Long zoneId) {
        return ResponseEntity.ok(poiContentService.getPois(zoneId));
    }

    // Toàn bộ POI ACTIVE kèm mọi bản dịch - nguồn dữ liệu cho bản đồ thuyết minh của du khách.
    @GetMapping("/api/content/pois/guide")
    public ResponseEntity<List<PoiGuideDto>> getPoiGuides(
            @RequestParam(required = false) Long zoneId,
            @RequestAttribute(value = "premiumEntitlement", required = false) Boolean premium,
            @RequestAttribute(value = "purchasedPoiIds", required = false) Set<Long> purchasedPoiIds) {
        return ResponseEntity.ok(poiContentService.getPoiGuides(
                zoneId, Boolean.TRUE.equals(premium), purchasedPoiIds));
    }

    @GetMapping("/api/content/pois/{id}")
    public ResponseEntity<PoiDetailDto> getPoiDetail(
            @PathVariable Long id,
            @RequestParam(defaultValue = "vi")
            @Pattern(regexp = "vi|en|ja|ko", message = "lang must be one of: vi, en, ja, ko") String lang) {
        return ResponseEntity.ok(poiContentService.getPoiDetail(id, lang));
    }

    @GetMapping("/api/content/pois/qr/{qrToken}")
    public ResponseEntity<PoiDetailDto> getPoiByQrToken(
            @PathVariable String qrToken,
            @RequestParam(defaultValue = "vi")
            @Pattern(regexp = "vi|en|ja|ko", message = "lang must be one of: vi, en, ja, ko") String lang) {
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

    // Nội bộ cho order-service: giá mua lẻ Premium của một POI.
    @GetMapping("/api/content/internal/pois/{id}/premium-price")
    public ResponseEntity<PoiPremiumPriceDto> getInternalPoiPremiumPrice(@PathVariable Long id) {
        return ResponseEntity.ok(poiContentService.getInternalPoiPremiumPrice(id));
    }

    @GetMapping("/api/content/admin/pois")
    public ResponseEntity<Page<AdminPoiListItemDto>> getAdminPois(
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long routeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String audioStatus,
            @RequestParam(required = false) String overallStatus,
            @RequestParam(required = false) String languageStatus,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(
                poiContentService.getAdminPois(
                        zoneId, routeId, status, search, audioStatus, overallStatus, languageStatus, pageable));
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

    // Ẩn/hiện/tạm dừng một POI. Tách khỏi PUT nội dung nên không cần gửi kèm version.
    @RequestMapping(
            value = "/api/content/admin/pois/{id}/status",
            method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AdminPoiDetailDto> changePoiStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePoiStatusRequest request) {
        return ResponseEntity.ok(poiContentService.changeStatus(id, request.getStatus()));
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

    // Ma trận trạng thái audio của toàn bộ POI, dùng trước demo và cho script kiểm tra.
    @GetMapping("/api/content/admin/audio/status")
    public ResponseEntity<AdminAudioStatusDto> getAudioStatus() {
        return ResponseEntity.ok(poiContentService.getAudioStatus());
    }

    // Tạo lại audio cho một POI. Không truyền languages = chỉ các ngôn ngữ chưa READY.
    @PostMapping("/api/content/admin/pois/{id}/audio/regenerate")
    public ResponseEntity<AudioRegenerationResultDto> regenerateAudio(
            @PathVariable Long id,
            @RequestParam(required = false) List<String> languages) {
        return ResponseEntity.accepted().body(poiContentService.regenerateAudio(id, languages));
    }

    // Tạo lại audio cho mọi POI còn ngôn ngữ chưa READY.
    @PostMapping("/api/content/admin/audio/regenerate")
    public ResponseEntity<AudioRegenerationBatchDto> regenerateNonReadyAudio() {
        return ResponseEntity.accepted().body(poiContentService.regenerateNonReadyAudio());
    }
}
