package com.echora.location.controller;

import com.echora.location.dto.NearbyPoiDto;
import com.echora.location.dto.PoiInternalQrDto;
import com.echora.location.dto.ResolvePoiResponse;
import com.echora.location.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyPoiDto>> getNearbyPois(
            @RequestParam("lat") Double lat,
            @RequestParam("lng") Double lng,
            @RequestParam("radius") Double radius
    ) {
        List<NearbyPoiDto> result = locationService.getNearbyPois(lat, lng, radius);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/resolve")
    public ResponseEntity<ResolvePoiResponse> resolvePoi(
            @RequestParam("lat") Double lat,
            @RequestParam("lng") Double lng
    ) {
        ResolvePoiResponse result = locationService.resolvePoi(lat, lng);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/qr/{qrToken}")
    public ResponseEntity<PoiInternalQrDto> resolveByQr(
            @PathVariable("qrToken") String qrToken
    ) {
        PoiInternalQrDto result = locationService.resolveByQr(qrToken);
        return ResponseEntity.ok(result);
    }
}
