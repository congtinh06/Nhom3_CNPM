package com.echora.location.service;

import com.echora.location.dto.NearbyPoiDto;
import com.echora.location.dto.PoiInternalQrDto;
import com.echora.location.dto.ResolvePoiResponse;

import java.util.List;

public interface LocationService {
    List<NearbyPoiDto> getNearbyPois(double lat, double lng, double radius);
    ResolvePoiResponse resolvePoi(double lat, double lng);
    PoiInternalQrDto resolveByQr(String qrToken);
}
