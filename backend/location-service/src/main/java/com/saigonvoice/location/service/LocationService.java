package com.saigonvoice.location.service;

import com.saigonvoice.location.dto.NearbyPoiDto;
import com.saigonvoice.location.dto.PoiInternalQrDto;
import com.saigonvoice.location.dto.ResolvePoiResponse;

import java.util.List;

public interface LocationService {
    List<NearbyPoiDto> getNearbyPois(double lat, double lng, double radius);
    ResolvePoiResponse resolvePoi(double lat, double lng);
    PoiInternalQrDto resolveByQr(String qrToken);
}
