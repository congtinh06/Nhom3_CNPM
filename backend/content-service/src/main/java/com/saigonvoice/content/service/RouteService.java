package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreateRouteRequest;
import com.saigonvoice.content.dto.RouteDetailDto;
import com.saigonvoice.content.dto.RouteDto;
import com.saigonvoice.content.dto.UpdateRouteStopsRequest;

import java.util.List;

public interface RouteService {

    List<RouteDto> getRoutes(Long zoneId);

    RouteDetailDto getRouteDetail(Long id);

    RouteDto createRoute(CreateRouteRequest request);

    RouteDetailDto updateStops(Long routeId, UpdateRouteStopsRequest request);
}
