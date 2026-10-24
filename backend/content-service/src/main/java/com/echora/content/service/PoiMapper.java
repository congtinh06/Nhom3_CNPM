package com.echora.content.service;

import com.echora.content.dto.PoiBoundingBoxDto;
import com.echora.content.dto.PoiPublishStatusDto;
import com.echora.content.dto.PoiSummaryDto;
import com.echora.content.entity.Poi;

/** Map entity POI -> DTO, dùng chung cho POI và Route. Gọi trong transaction (zone/category/route là LAZY). */
final class PoiMapper {

    private PoiMapper() {
    }

    static PoiSummaryDto toSummary(Poi poi) {
        return PoiSummaryDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .qrToken(poi.getQrToken())
                .name(poi.getName())
                .slug(poi.getSlug())
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .address(poi.getAddress())
                .thumbnailUrl(poi.getThumbnailUrl())
                .zoneId(poi.getZone().getId())
                .zoneCode(poi.getZone().getCode())
                .categoryCode(poi.getCategory().getCode())
                .categoryNameVi(poi.getCategory().getNameVi())
                .routeId(poi.getRoute() != null ? poi.getRoute().getId() : null)
                .stopOrder(poi.getStopOrder())
                .build();
    }

    static PoiBoundingBoxDto toBoundingBox(Poi poi) {
        return PoiBoundingBoxDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .qrToken(poi.getQrToken())
                .name(poi.getName())
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .zoneId(poi.getZone().getId())
                .build();
    }

    static PoiPublishStatusDto toPublishStatus(Poi poi) {
        return PoiPublishStatusDto.builder()
                .poiId(poi.getId())
                .poiCode(poi.getCode())
                .publishStatus(poi.getPublishStatus())
                .publishAttempts(poi.getPublishAttempts())
                .lastPublishError(poi.getLastPublishError())
                .lastPublishAttemptAt(poi.getLastPublishAttemptAt())
                .build();
    }
}
