package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreateZoneRequest;
import com.saigonvoice.content.dto.ZoneDto;

import java.math.BigDecimal;
import java.util.List;

public interface ZoneService {
    List<ZoneDto> getAllActiveZones();
    ZoneDto getZoneById(Long id);
    ZoneDto createZone(CreateZoneRequest request);
    ZoneDto updateZone(Long id, com.saigonvoice.content.dto.UpdateZoneRequest request);
    void validateNoZoneOverlap(BigDecimal centerLat, BigDecimal centerLng, int radiusMeters, Long excludeZoneId);
}
