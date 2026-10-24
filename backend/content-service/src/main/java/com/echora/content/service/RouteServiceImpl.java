package com.echora.content.service;

import com.echora.content.dto.AdminRouteDetailDto;
import com.echora.content.dto.AdminRouteListItemDto;
import com.echora.content.dto.CreateRouteRequest;
import com.echora.content.dto.RouteDetailDto;
import com.echora.content.dto.RouteDto;
import com.echora.content.dto.UpdateRouteRequest;
import com.echora.content.dto.UpdateRouteStopsRequest;
import com.echora.content.entity.Poi;
import com.echora.content.entity.Route;
import com.echora.content.entity.Zone;
import com.echora.content.exception.BadRequestException;
import com.echora.content.exception.ConflictException;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.RouteRepository;
import com.echora.content.repository.ZoneRepository;
import com.echora.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final ZoneRepository zoneRepository;
    private final PoiRepository poiRepository;
    private final RouteStopsSynchronizer routeStopsSynchronizer;

    @Override
    public List<RouteDto> getRoutes(Long zoneId) {
        return routeRepository.findActive(zoneId).stream()
                .map(r -> toDto(r, poiRepository.countByRouteId(r.getId())))
                .toList();
    }

    @Override
    public RouteDetailDto getRouteDetail(Long id) {
        Route route = findRoute(id);
        return toDetail(route, poiRepository.findStopsOfRoute(id));
    }

    @Override
    @Transactional
    public RouteDto createRoute(CreateRouteRequest request) {
        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + request.getZoneId()));
        String name = request.getName().trim();
        if (routeRepository.existsByZoneIdAndName(zone.getId(), name)) {
            throw new BadRequestException("Route name already exists in this zone: " + name);
        }
        Route route = routeRepository.save(Route.builder()
                .zone(zone)
                .name(name)
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .status("ACTIVE")
                .createdAt(TimeUtils.nowUtc())
                .build());
        return toDto(route, 0);
    }

    @Override
    @Transactional
    public AdminRouteDetailDto updateStops(Long routeId, UpdateRouteStopsRequest request) {
        Route route = findRoute(routeId);
        Long routeZoneId = route.getZone().getId();
        List<Long> poiIds = request.getPoiIds();

        if (request.getVersion() == null || !Objects.equals(route.getVersion(), request.getVersion())) {
            throw new ConflictException("Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.");
        }

        Set<Long> unique = new HashSet<>(poiIds);
        if (poiIds.contains(null) || unique.size() != poiIds.size()) {
            throw new BadRequestException("poiIds must not contain null or duplicate values");
        }
        Map<Long, Poi> found = poiRepository.findAllById(poiIds).stream()
                .collect(Collectors.toMap(Poi::getId, Function.identity()));
        for (Long poiId : poiIds) {
            Poi poi = found.get(poiId);
            if (poi == null) {
                throw new ResourceNotFoundException("POI not found with id: " + poiId);
            }
            if (!Objects.equals(poi.getZone().getId(), routeZoneId)) {
                throw new BadRequestException("POI " + poiId + " belongs to another zone than route " + routeId);
            }
        }

        // Ghi nhận tuyến cũ của các POI sẽ được di chuyển sang tuyến này
        Set<Long> affectedOldRouteIds = found.values().stream()
                .map(p -> p.getRoute() != null ? p.getRoute().getId() : null)
                .filter(Objects::nonNull)
                .filter(id -> !Objects.equals(id, routeId))
                .collect(Collectors.toSet());

        // Gỡ hết điểm dừng cũ trước, rồi gán thứ tự mới 1..n
        poiRepository.detachAllFromRoute(routeId);
        List<Poi> pois = poiRepository.findAllById(poiIds);
        Map<Long, Poi> byId = pois.stream().collect(Collectors.toMap(Poi::getId, Function.identity()));
        for (int i = 0; i < poiIds.size(); i++) {
            Poi poi = byId.get(poiIds.get(i));
            if (poi != null) {
                poi.setRoute(route);
                poi.setStopOrder(i + 1);
                poi.setUpdatedAt(TimeUtils.nowUtc());
            }
        }
        route.setVersion((route.getVersion() == null ? 0L : route.getVersion()) + 1);
        routeRepository.save(route);
        poiRepository.saveAll(pois);
        poiRepository.flush();

        // Đảm bảo tuyến cũ của các POI bị di chuyển vẫn có stop_order liên tục
        for (Long oldRouteId : affectedOldRouteIds) {
            routeStopsSynchronizer.renumberRoute(oldRouteId);
        }

        return toAdminDetail(findRoute(routeId), poiRepository.findStopsOfRoute(routeId));
    }

    @Override
    public Page<AdminRouteListItemDto> getAdminRoutes(Long zoneId, String status, String search, Pageable pageable) {
        String normalizedStatus = (status != null && !status.isBlank()) ? status.trim().toUpperCase(Locale.ROOT) : null;
        String searchPattern = (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%" : null;

        Page<Route> page = routeRepository.searchAdminRoutes(zoneId, normalizedStatus, searchPattern, pageable);

        List<Long> ids = page.getContent().stream().map(Route::getId).toList();
        Map<Long, Long> counts = loadStopCounts(ids);

        return page.map(route -> mapToAdminListItem(route, counts.getOrDefault(route.getId(), 0L)));
    }

    @Override
    public AdminRouteDetailDto getAdminRouteDetail(Long id) {
        Route route = findRoute(id);
        List<Poi> stops = poiRepository.findStopsOfRoute(id);
        return toAdminDetail(route, stops);
    }

    @Override
    @Transactional
    public AdminRouteDetailDto updateRoute(Long routeId, UpdateRouteRequest request) {
        Route route = findRoute(routeId);
        Long zoneId = route.getZone().getId();

        if (request.getVersion() == null || !Objects.equals(route.getVersion(), request.getVersion())) {
            throw new ConflictException("Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.");
        }

        String name = request.getName().trim();

        // Kiểm tra trùng tên trong cùng khu vực (bỏ qua chính nó khi giữ nguyên tên)
        if (!name.equals(route.getName()) && routeRepository.existsByZoneIdAndName(zoneId, name)) {
            throw new BadRequestException("Route name already exists in this zone: " + name);
        }

        String newStatus = request.getStatus() != null && !request.getStatus().isBlank()
                ? request.getStatus().trim().toUpperCase(Locale.ROOT) : route.getStatus();

        // Chặn ngừng hoạt động khi tuyến vẫn còn điểm dừng
        if ("INACTIVE".equals(newStatus) && !"INACTIVE".equals(route.getStatus())) {
            long stopCount = poiRepository.countByRouteId(routeId);
            if (stopCount > 0) {
                throw new BadRequestException("Không thể ngừng hoạt động tuyến khi vẫn còn "
                        + stopCount + " điểm dừng. Vui lòng gỡ hết điểm dừng trước.");
            }
        }

        route.setName(name);
        route.setDescription(request.getDescription());
        if (request.getDisplayOrder() != null) {
            route.setDisplayOrder(request.getDisplayOrder());
        }
        route.setStatus(newStatus);
        route.setVersion((route.getVersion() == null ? 0L : route.getVersion()) + 1);

        Route saved = routeRepository.save(route);
        return toAdminDetail(saved, poiRepository.findStopsOfRoute(routeId));
    }

    @Override
    @Transactional
    public AdminRouteDetailDto updateStatus(Long routeId, boolean isActive) {
        Route route = findRoute(routeId);
        String newStatus = isActive ? "ACTIVE" : "INACTIVE";
        if ("INACTIVE".equals(newStatus) && !"INACTIVE".equals(route.getStatus())) {
            long stopCount = poiRepository.countByRouteId(routeId);
            if (stopCount > 0) {
                throw new BadRequestException("Không thể ngừng hoạt động tuyến khi vẫn còn "
                        + stopCount + " điểm dừng. Vui lòng gỡ hết điểm dừng trước.");
            }
        }
        route.setStatus(newStatus);
        Route saved = routeRepository.save(route);
        return toAdminDetail(saved, poiRepository.findStopsOfRoute(routeId));
    }

    private Map<Long, Long> loadStopCounts(List<Long> routeIds) {
        if (routeIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : poiRepository.countStopsByRouteIds(routeIds)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private Route findRoute(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
    }

    private RouteDto toDto(Route route, long stopCount) {
        return RouteDto.builder()
                .id(route.getId())
                .zoneId(route.getZone().getId())
                .zoneCode(route.getZone().getCode())
                .name(route.getName())
                .description(route.getDescription())
                .displayOrder(route.getDisplayOrder())
                .status(route.getStatus())
                .stopCount(stopCount)
                .build();
    }

    private RouteDetailDto toDetail(Route route, List<Poi> stops) {
        return RouteDetailDto.builder()
                .id(route.getId())
                .zoneId(route.getZone().getId())
                .zoneCode(route.getZone().getCode())
                .name(route.getName())
                .description(route.getDescription())
                .displayOrder(route.getDisplayOrder())
                .status(route.getStatus())
                .stops(stops.stream().map(PoiMapper::toSummary).toList())
                .build();
    }

    private AdminRouteListItemDto mapToAdminListItem(Route route, long stopCount) {
        return AdminRouteListItemDto.builder()
                .id(route.getId())
                .zoneId(route.getZone().getId())
                .zoneCode(route.getZone().getCode())
                .zoneName(route.getZone().getName())
                .name(route.getName())
                .displayOrder(route.getDisplayOrder())
                .status(route.getStatus())
                .stopCount(stopCount)
                .version(route.getVersion())
                .build();
    }

    private AdminRouteDetailDto toAdminDetail(Route route, List<Poi> stops) {
        return AdminRouteDetailDto.builder()
                .id(route.getId())
                .zoneId(route.getZone().getId())
                .zoneCode(route.getZone().getCode())
                .zoneName(route.getZone().getName())
                .name(route.getName())
                .description(route.getDescription())
                .displayOrder(route.getDisplayOrder())
                .status(route.getStatus())
                .stopCount(stops.size())
                .stops(stops.stream().map(PoiMapper::toSummary).toList())
                .version(route.getVersion())
                .build();
    }
}
