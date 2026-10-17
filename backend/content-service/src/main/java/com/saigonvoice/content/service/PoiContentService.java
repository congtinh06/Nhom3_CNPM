package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.AdminPoiDetailDto;
import com.saigonvoice.content.dto.AdminPoiListItemDto;
import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiGuideDto;
import com.saigonvoice.content.dto.PoiInternalQrDto;
import com.saigonvoice.content.dto.PoiPublishStatusDto;
import com.saigonvoice.content.dto.PoiSummaryDto;
import com.saigonvoice.content.dto.UpdatePoiRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface PoiContentService {

    List<PoiSummaryDto> getPois(Long zoneId);

    List<PoiGuideDto> getPoiGuides(Long zoneId);

    Page<AdminPoiListItemDto> getAdminPois(Long zoneId, Long routeId, String status, String search, String audioStatus, Pageable pageable);

    AdminPoiDetailDto getAdminPoiDetail(Long id);

    PoiDetailDto getPoiDetail(Long id, String lang);

    PoiDetailDto getPoiByQrToken(String qrToken, String lang);

    PoiInternalQrDto getInternalPoiByQrToken(String qrToken);

    List<PoiBoundingBoxDto> getPoisInBoundingBox(Long zoneId, BigDecimal minLat, BigDecimal maxLat, BigDecimal minLng, BigDecimal maxLng);

    PoiDetailDto createPoi(CreatePoiRequest request);

    AdminPoiDetailDto updatePoi(Long id, UpdatePoiRequest request);

    PoiPublishStatusDto getPublishStatus(Long poiId);

    List<PoiPublishStatusDto> getPublishStatuses(String status);

    PoiPublishStatusDto republish(Long poiId);
}
