package com.echora.location.service;

import com.echora.location.dto.NearbyPoisResponse;
import com.echora.location.dto.PoiInternalQrDto;
import com.echora.location.dto.ResolvePoiResponse;

public interface LocationService {
    NearbyPoisResponse getNearbyPois(double lat, double lng, double radius);
    ResolvePoiResponse resolvePoi(double lat, double lng);
    PoiInternalQrDto resolveByQr(String qrToken);
}
