package com.antiphishing.poi.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyResponseDto {
    private PoiDto poi;
    private long distanceMeters;
    private NarrationDto narration;
    private List<NearbyItemDto> nearbyPois;
}
