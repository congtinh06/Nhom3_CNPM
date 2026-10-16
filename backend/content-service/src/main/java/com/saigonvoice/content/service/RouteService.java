package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.AdminRouteDetailDto;
import com.saigonvoice.content.dto.AdminRouteListItemDto;
import com.saigonvoice.content.dto.CreateRouteRequest;
import com.saigonvoice.content.dto.RouteDetailDto;
import com.saigonvoice.content.dto.RouteDto;
import com.saigonvoice.content.dto.UpdateRouteRequest;
import com.saigonvoice.content.dto.UpdateRouteStopsRequest;
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
