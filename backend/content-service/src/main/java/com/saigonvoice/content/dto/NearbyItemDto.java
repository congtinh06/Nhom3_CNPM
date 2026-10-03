package com.saigonvoice.content.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyItemDto {
    private PoiDto poi;
    private long distanceMeters;
    private NarrationDto narration;
}
