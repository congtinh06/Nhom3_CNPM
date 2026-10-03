package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiSummaryDto;

import java.math.BigDecimal;
import java.util.List;

public interface PoiContentService {

    List<PoiSummaryDto> getPois(Long zoneId);

    PoiDetailDto getPoiDetail(Long id, String lang);

    PoiDetailDto getPoiByQrToken(String qrToken, String lang);

    List<PoiBoundingBoxDto> getPoisInBoundingBox(Long zoneId, BigDecimal minLat, BigDecimal maxLat, BigDecimal minLng, BigDecimal maxLng);

    PoiDetailDto createPoi(CreatePoiRequest request);
}
