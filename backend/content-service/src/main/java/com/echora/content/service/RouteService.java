package com.echora.content.service;

import com.echora.content.dto.AdminRouteDetailDto;
import com.echora.content.dto.AdminRouteListItemDto;
import com.echora.content.dto.CreateRouteRequest;
import com.echora.content.dto.RouteDetailDto;
import com.echora.content.dto.RouteDto;
import com.echora.content.dto.UpdateRouteRequest;
import com.echora.content.dto.UpdateRouteStopsRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RouteService {

    List<RouteDto> getRoutes(Long zoneId);

    RouteDetailDto getRouteDetail(Long id);

    RouteDto createRoute(CreateRouteRequest request);

    AdminRouteDetailDto updateStops(Long routeId, UpdateRouteStopsRequest request);

    Page<AdminRouteListItemDto> getAdminRoutes(Long zoneId, String status, String search, Pageable pageable);

    AdminRouteDetailDto getAdminRouteDetail(Long id);

    AdminRouteDetailDto updateRoute(Long routeId, UpdateRouteRequest request);

    AdminRouteDetailDto updateStatus(Long routeId, boolean isActive);
}
