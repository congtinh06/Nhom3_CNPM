package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreateZoneRequest;
import com.saigonvoice.content.dto.ZoneDto;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.ZoneRepository;
import com.saigonvoice.content.util.GeoUtils;
import com.saigonvoice.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZoneServiceImpl implements ZoneService {

    private final ZoneRepository zoneRepository;

    @Override
    public List<ZoneDto> getAllActiveZones() {
        return zoneRepository.findByIsActiveTrue().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public ZoneDto getZoneById(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + id));
        return mapToDto(zone);
    }

    @Override
    @Transactional
    public ZoneDto createZone(CreateZoneRequest request) {
        String code = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (zoneRepository.existsByCode(code)) {
            throw new BadRequestException("Zone code already exists: " + code);
        }
        validateNoZoneOverlap(request.getCenterLat(), request.getCenterLng(), request.getRadiusMeters(), null);

        Zone zone = zoneRepository.save(Zone.builder()
                .code(code)
                .name(request.getName().trim())
                .description(request.getDescription())
                .centerLat(request.getCenterLat())
                .centerLng(request.getCenterLng())
                .radiusMeters(request.getRadiusMeters())
                .isActive(true)
                .createdAt(TimeUtils.nowUtc())
                .build());

        return mapToDto(zone);
    }

    @Override
    @Transactional
    public ZoneDto updateZone(Long id, com.saigonvoice.content.dto.UpdateZoneRequest request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + id));

        // Kiểm tra chồng lấn với các zone khác (ngoại trừ zone hiện tại đang sửa)
        boolean checkOverlap = request.getIsActive() == null || request.getIsActive();
        if (checkOverlap) {
            validateNoZoneOverlap(request.getCenterLat(), request.getCenterLng(), request.getRadiusMeters(), id);
        }

        zone.setName(request.getName().trim());
        zone.setDescription(request.getDescription());
        zone.setCenterLat(request.getCenterLat());
        zone.setCenterLng(request.getCenterLng());
        zone.setRadiusMeters(request.getRadiusMeters());
        if (request.getIsActive() != null) {
            zone.setIsActive(request.getIsActive());
        }

        return mapToDto(zoneRepository.save(zone));
    }

    @Override
    public void validateNoZoneOverlap(BigDecimal centerLat, BigDecimal centerLng, int radiusMeters, Long excludeZoneId) {
        List<Zone> activeZones = zoneRepository.findByIsActiveTrue();
        for (Zone existing : activeZones) {
            if (excludeZoneId != null && Objects.equals(existing.getId(), excludeZoneId)) {
                continue;
            }
            double distance = GeoUtils.haversineMeters(centerLat, centerLng, existing.getCenterLat(), existing.getCenterLng());
            double sumRadius = (double) radiusMeters + existing.getRadiusMeters();
            if (distance < sumRadius) {
                throw new BadRequestException(String.format(
                        "Khu vực mới bị chồng lấn với khu vực '%s' (mã: %s): khoảng cách giữa 2 tâm là %.1fm nhỏ hơn tổng bán kính %.1fm (bán kính mới: %dm + bán kính cũ: %dm)",
                        existing.getName(), existing.getCode(), distance, sumRadius, radiusMeters, existing.getRadiusMeters()));
            }
        }
    }

    private ZoneDto mapToDto(Zone zone) {
        return ZoneDto.builder()
                .id(zone.getId())
                .code(zone.getCode())
                .name(zone.getName())
                .description(zone.getDescription())
                .centerLat(zone.getCenterLat())
                .centerLng(zone.getCenterLng())
                .radiusMeters(zone.getRadiusMeters())
                .build();
    }
}
