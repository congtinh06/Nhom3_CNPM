package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.CreateRouteRequest;
import com.saigonvoice.content.dto.RouteDetailDto;
import com.saigonvoice.content.dto.RouteDto;
import com.saigonvoice.content.dto.UpdateRouteStopsRequest;
import com.saigonvoice.content.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
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

    @PostMapping("/api/content/admin/routes")
    public ResponseEntity<RouteDto> createRoute(@Valid @RequestBody CreateRouteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeService.createRoute(request));
    }

    @PutMapping("/api/content/admin/routes/{id}/stops")
    public ResponseEntity<RouteDetailDto> updateStops(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateRouteStopsRequest request) {
        return ResponseEntity.ok(routeService.updateStops(id, request));
    }
}
