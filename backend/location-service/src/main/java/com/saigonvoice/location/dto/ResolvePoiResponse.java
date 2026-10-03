package com.saigonvoice.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolvePoiResponse {
    private boolean matched;
    private NearbyPoiDto poi;

    public static ResolvePoiResponse notMatched() {
        return ResolvePoiResponse.builder()
                .matched(false)
                .poi(null)
                .build();
    }

    public static ResolvePoiResponse matched(NearbyPoiDto poi) {
        return ResolvePoiResponse.builder()
                .matched(true)
                .poi(poi)
                .build();
    }
}
