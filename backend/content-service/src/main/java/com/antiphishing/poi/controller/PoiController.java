package com.antiphishing.poi.controller;

import com.antiphishing.poi.dto.NearbyResponseDto;
import com.antiphishing.poi.service.PoiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PoiController {

    private final PoiService poiService;

    @GetMapping({"/api/poi/nearby", "/api/v1/poi/nearby"})
    public ResponseEntity<NearbyResponseDto> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1500") int radius,
            @RequestParam(required = false) String bank,
            @RequestParam(defaultValue = "vi") String lang) {

        NearbyResponseDto result = poiService.getNearby(lat, lng, radius, bank, lang);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }
}
