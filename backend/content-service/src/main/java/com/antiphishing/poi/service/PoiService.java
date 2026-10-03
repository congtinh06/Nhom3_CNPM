package com.antiphishing.poi.service;

import com.antiphishing.poi.dto.NearbyResponseDto;

public interface PoiService {
    NearbyResponseDto getNearby(double lat, double lng, int radius, String bank, String lang);
}
