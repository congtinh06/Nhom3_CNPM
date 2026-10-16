package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.AdminRouteDetailDto;
import com.saigonvoice.content.dto.AdminRouteListItemDto;
import com.saigonvoice.content.dto.CreateRouteRequest;
import com.saigonvoice.content.dto.RouteDetailDto;
import com.saigonvoice.content.dto.RouteDto;
import com.saigonvoice.content.dto.UpdateRouteRequest;
import com.saigonvoice.content.dto.UpdateRouteStopsRequest;
import com.saigonvoice.content.dto.UpdateStatusRequest;
import com.saigonvoice.content.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @GetMapping("/api/content/routes")
    public ResponseEntity<List<RouteDto>> getRoutes(@RequestParam(required = false) Long zoneId) {
        return ResponseEntity.ok(routeService.getRoutes(zoneId));
    }

    @GetMapping("/api/content/routes/{id}")
    public ResponseEntity<RouteDetailDto> getRouteDetail(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getRouteDetail(id));
    }

    @GetMapping("/api/content/admin/routes")
    public ResponseEntity<Page<AdminRouteListItemDto>> getAdminRoutes(
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(routeService.getAdminRoutes(zoneId, status, search, pageable));
    }

    @GetMapping("/api/content/admin/routes/{id}")
    public ResponseEntity<AdminRouteDetailDto> getAdminRouteDetail(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getAdminRouteDetail(id));
    }

    @PostMapping("/api/content/admin/routes")
    public ResponseEntity<RouteDto> createRoute(@Valid @RequestBody CreateRouteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeService.createRoute(request));
    }

    @PutMapping("/api/content/admin/routes/{id}")
    public ResponseEntity<AdminRouteDetailDto> updateRoute(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateRouteRequest request) {
        return ResponseEntity.ok(routeService.updateRoute(id, request));
    }

    @PutMapping("/api/content/admin/routes/{id}/stops")
    public ResponseEntity<AdminRouteDetailDto> updateStops(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateRouteStopsRequest request) {
        return ResponseEntity.ok(routeService.updateStops(id, request));
    }

    @RequestMapping(value = "/api/content/admin/routes/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AdminRouteDetailDto> updateRouteStatus(@PathVariable Long id,
                                                                 @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(routeService.updateStatus(id, request.getIsActive()));
    }
}
