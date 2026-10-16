package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.AdminZoneDetailDto;
import com.saigonvoice.content.dto.AdminZoneListItemDto;
import com.saigonvoice.content.dto.CreateZoneRequest;
import com.saigonvoice.content.dto.UpdateZoneRequest;
import com.saigonvoice.content.dto.ZoneDto;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ConflictException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.RouteRepository;
import com.saigonvoice.content.repository.ZoneRepository;
import com.saigonvoice.content.util.GeoUtils;
import com.saigonvoice.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZoneServiceImpl implements ZoneService {

    private final ZoneRepository zoneRepository;
    private final PoiRepository poiRepository;
    private final RouteRepository routeRepository;

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
    public Page<AdminZoneListItemDto> getAdminZones(String search, Boolean isActive, Pageable pageable) {
        String searchPattern = (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%" : null;
        Page<Zone> page = zoneRepository.searchAdminZones(isActive, searchPattern, pageable);

        List<Long> ids = page.getContent().stream().map(Zone::getId).toList();
        Map<Long, Long> counts = loadPoiCounts(ids);

        return page.map(zone -> mapToAdminListItem(zone, counts.getOrDefault(zone.getId(), 0L)));
    }

    @Override
    public AdminZoneDetailDto getAdminZoneDetail(Long id) {
        return toAdminZoneDetail(id);
    }

    private AdminZoneDetailDto toAdminZoneDetail(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + id));
        long poiCount = poiRepository.countByZoneId(id);
        long routeCount = routeRepository.countByZoneId(id);
        return AdminZoneDetailDto.builder()
                .id(zone.getId())
                .code(zone.getCode())
                .name(zone.getName())
                .description(zone.getDescription())
                .centerLat(zone.getCenterLat())
                .centerLng(zone.getCenterLng())
                .radiusMeters(zone.getRadiusMeters())
                .isActive(zone.getIsActive())
                .poiCount(poiCount)
                .routeCount(routeCount)
                .version(zone.getVersion())
                .build();
    }

    @Override
    @Transactional
    public AdminZoneDetailDto updateStatus(Long id, boolean isActive) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + id));
        if (!isActive) {
            long poiCount = poiRepository.countByZoneId(id);
            if (poiCount > 0) {
                throw new BadRequestException("Không thể ngừng hoạt động khu vực khi vẫn còn "
                        + poiCount + " điểm thuyết minh thuộc khu vực này. Vui lòng chuyển hoặc xóa các điểm trước.");
            }
        }
        zone.setIsActive(isActive);
        zoneRepository.save(zone);
        return toAdminZoneDetail(id);
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
    public ZoneDto updateZone(Long id, UpdateZoneRequest request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + id));

        if (request.getVersion() == null || !Objects.equals(zone.getVersion(), request.getVersion())) {
            throw new ConflictException("Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.");
        }

        // Kiểm tra chồng lấn với các zone khác (ngoại trừ zone hiện tại đang sửa)
        boolean checkOverlap = request.getIsActive() == null || request.getIsActive();
        if (checkOverlap) {
            validateNoZoneOverlap(request.getCenterLat(), request.getCenterLng(), request.getRadiusMeters(), id);
        }

        // Chặn ngừng hoạt động khi khu vực vẫn còn điểm thuyết minh
        if (Boolean.FALSE.equals(request.getIsActive())) {
            long poiCount = poiRepository.countByZoneId(id);
            if (poiCount > 0) {
                throw new BadRequestException("Không thể ngừng hoạt động khu vực khi vẫn còn "
                        + poiCount + " điểm thuyết minh thuộc khu vực này. Vui lòng chuyển hoặc xóa các điểm trước.");
            }
        }

        zone.setName(request.getName().trim());
        zone.setDescription(request.getDescription());
        zone.setCenterLat(request.getCenterLat());
        zone.setCenterLng(request.getCenterLng());
        zone.setRadiusMeters(request.getRadiusMeters());
        if (request.getIsActive() != null) {
            zone.setIsActive(request.getIsActive());
        }
        zone.setVersion((zone.getVersion() == null ? 0L : zone.getVersion()) + 1);

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

    private Map<Long, Long> loadPoiCounts(List<Long> zoneIds) {
        if (zoneIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : poiRepository.countPoisByZoneIds(zoneIds)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private AdminZoneListItemDto mapToAdminListItem(Zone zone, long poiCount) {
        return AdminZoneListItemDto.builder()
                .id(zone.getId())
                .code(zone.getCode())
                .name(zone.getName())
                .centerLat(zone.getCenterLat())
                .centerLng(zone.getCenterLng())
                .radiusMeters(zone.getRadiusMeters())
                .isActive(zone.getIsActive())
                .poiCount(poiCount)
                .version(zone.getVersion())
                .build();
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
