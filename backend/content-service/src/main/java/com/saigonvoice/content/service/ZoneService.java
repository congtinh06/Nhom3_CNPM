package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.ZoneDto;
import java.util.List;

public interface ZoneService {
    List<ZoneDto> getAllActiveZones();
    ZoneDto getZoneById(Long id);
}
