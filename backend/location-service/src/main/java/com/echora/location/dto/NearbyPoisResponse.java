package com.echora.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for GET /api/location/nearby.
 *
 * <p>{@code degraded=true} means content-service could not be reached. The POI list is then
 * intentionally empty instead of failing the whole page, and the client can show a friendly
 * retry notice.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPoisResponse {

    public static final String DEGRADED_NOTICE =
            "Không thể tải danh sách điểm gần bạn lúc này. Vui lòng thử lại sau.";

    private List<NearbyPoiDto> pois;
    private boolean degraded;
    private String notice;

    public static NearbyPoisResponse ok(List<NearbyPoiDto> pois) {
        return NearbyPoisResponse.builder()
                .pois(pois == null ? List.of() : pois)
                .degraded(false)
                .build();
    }

    public static NearbyPoisResponse degraded() {
        return NearbyPoisResponse.builder()
                .pois(List.of())
                .degraded(true)
                .notice(DEGRADED_NOTICE)
                .build();
    }
}
