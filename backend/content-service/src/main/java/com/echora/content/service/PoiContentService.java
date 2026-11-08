package com.echora.content.service;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface PoiContentService {

    List<PoiSummaryDto> getPois(Long zoneId);

    /**
     * @param purchasedPoiIds các POI user đã mua lẻ (null/rỗng = không có mua lẻ).
     *                        Khi includePremiumTranslations = false, chỉ thêm bản dịch
     *                        ngoại ngữ của các POI trong danh sách này.
     */
    List<PoiGuideDto> getPoiGuides(Long zoneId, boolean includePremiumTranslations, Collection<Long> purchasedPoiIds);

    Page<AdminPoiListItemDto> getAdminPois(
            Long zoneId, Long routeId, String status, String search, String audioStatus,
            String overallStatus, String languageStatus, Pageable pageable);

    AdminPoiDetailDto getAdminPoiDetail(Long id);

    PoiDetailDto getPoiDetail(Long id, String lang);

    PoiDetailDto getPoiByQrToken(String qrToken, String lang);

    PoiDetailDto getPoiBySlug(String slug, String lang);

    PoiInternalQrDto getInternalPoiByQrToken(String qrToken);

    java.util.Optional<Long> findPoiIdByQrToken(String qrToken);

    java.util.Optional<Long> findPoiIdBySlug(String slug);

    List<PoiBoundingBoxDto> getPoisInBoundingBox(Long zoneId, BigDecimal minLat, BigDecimal maxLat, BigDecimal minLng, BigDecimal maxLng);

    PoiDetailDto createPoi(CreatePoiRequest request);

    AdminPoiDetailDto updatePoi(Long id, UpdatePoiRequest request);

    /**
     * Đổi trạng thái hiển thị của POI (ACTIVE / INACTIVE / MAINTENANCE).
     * Ẩn POI (INACTIVE) sẽ loại nó khỏi mọi API công khai ngay lập tức.
     */
    AdminPoiDetailDto changeStatus(Long id, String status);

    PoiPublishStatusDto getPublishStatus(Long poiId);

    List<PoiPublishStatusDto> getPublishStatuses(String status);

    PoiPublishStatusDto republish(Long poiId);

    /** Trạng thái audio của toàn bộ POI theo 4 ngôn ngữ, dùng cho admin và script kiểm tra. */
    AdminAudioStatusDto getAudioStatus();

    /**
     * Tạo lại audio cho một POI. languages null/rỗng = mọi ngôn ngữ chưa READY.
     * Danh sách ngôn ngữ chỉ định sẽ được tạo lại kể cả khi đang READY.
     */
    AudioRegenerationResultDto regenerateAudio(Long poiId, List<String> languages);

    /** Tạo lại audio cho mọi POI có ít nhất một ngôn ngữ chưa READY. */
    AudioRegenerationBatchDto regenerateNonReadyAudio();

    /**
     * Endpoint nội bộ cho order-service: giá mua lẻ Premium của 1 POI.
     */
    PoiPremiumPriceDto getInternalPoiPremiumPrice(Long poiId);
}
