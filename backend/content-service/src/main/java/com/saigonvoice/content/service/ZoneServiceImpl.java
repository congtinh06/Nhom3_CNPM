package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.ZoneDto;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
