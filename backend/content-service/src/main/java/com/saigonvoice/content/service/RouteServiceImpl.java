package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreateRouteRequest;
import com.saigonvoice.content.dto.RouteDetailDto;
import com.saigonvoice.content.dto.RouteDto;
import com.saigonvoice.content.dto.UpdateRouteStopsRequest;
import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.Route;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.RouteRepository;
import com.saigonvoice.content.repository.ZoneRepository;
import com.saigonvoice.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
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
    public RouteDetailDto updateStops(Long routeId, UpdateRouteStopsRequest request) {
        Route route = findRoute(routeId);
        Long routeZoneId = route.getZone().getId();
        List<Long> poiIds = request.getPoiIds();

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

        // Gỡ hết điểm dừng cũ trước (persistence context bị clear), rồi gán thứ tự mới 1..n
        poiRepository.detachAllFromRoute(routeId);
        Route routeRef = routeRepository.getReferenceById(routeId);
        List<Poi> pois = poiRepository.findAllById(poiIds);
        Map<Long, Poi> byId = pois.stream().collect(Collectors.toMap(Poi::getId, Function.identity()));
        for (int i = 0; i < poiIds.size(); i++) {
            Poi poi = byId.get(poiIds.get(i));
            poi.setRoute(routeRef);
            poi.setStopOrder(i + 1);
            poi.setUpdatedAt(TimeUtils.nowUtc());
        }
        poiRepository.saveAll(pois);
        poiRepository.flush();

        return toDetail(findRoute(routeId), poiRepository.findStopsOfRoute(routeId));
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
}
