package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.NearbyResponseDto;

public interface PoiService {
    NearbyResponseDto getNearby(double lat, double lng, int radius, String bank, String lang);
}
