package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.AdminZoneDetailDto;
import com.saigonvoice.content.dto.AdminZoneListItemDto;
import com.saigonvoice.content.dto.CreateZoneRequest;
import com.saigonvoice.content.dto.UpdateZoneRequest;
import com.saigonvoice.content.dto.ZoneDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ZoneService {
    List<ZoneDto> getAllActiveZones();
    ZoneDto getZoneById(Long id);
    ZoneDto createZone(CreateZoneRequest request);
    ZoneDto updateZone(Long id, UpdateZoneRequest request);
    void validateNoZoneOverlap(BigDecimal centerLat, BigDecimal centerLng, int radiusMeters, Long excludeZoneId);

    Page<AdminZoneListItemDto> getAdminZones(String search, Boolean isActive, Pageable pageable);
    AdminZoneDetailDto getAdminZoneDetail(Long id);
    AdminZoneDetailDto updateStatus(Long id, boolean isActive);
}
