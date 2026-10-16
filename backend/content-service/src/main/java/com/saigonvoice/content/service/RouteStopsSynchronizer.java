package com.saigonvoice.content.service;

import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.Route;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.RouteRepository;
import com.saigonvoice.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RouteStopsSynchronizer {

    private final RouteRepository routeRepository;
    private final PoiRepository poiRepository;

    /**
     * Đảm bảo stop_order của tuyến liên tục 1..n theo thứ tự hiện tại.
     * Sử dụng phương án offset giá trị lớn (+10_000_000) để tránh vi phạm unique index.
     */
    @Transactional
    public void renumberRoute(Long routeId) {
        if (routeId == null) {
            return;
        }
        List<Poi> stops = poiRepository.findStopsOfRoute(routeId);
        if (stops.isEmpty()) {
            return;
        }
        // Giai đoạn 1: offset giá trị stop_order để tránh xung đột unique
        for (int i = 0; i < stops.size(); i++) {
            stops.get(i).setStopOrder(i + 10000000);
        }
        poiRepository.saveAll(stops);
        poiRepository.flush();

        // Giai đoạn 2: gán lại 1..n
        Route ref = routeRepository.getReferenceById(routeId);
        Map<Long, Poi> byId = stops.stream().collect(Collectors.toMap(Poi::getId, Function.identity()));
        for (int i = 0; i < stops.size(); i++) {
            Long poiId = stops.get(i).getId();
            Poi poi = byId.get(poiId);
            if (poi != null) {
                poi.setRoute(ref);
                poi.setStopOrder(i + 1);
                poi.setUpdatedAt(TimeUtils.nowUtc());
            }
        }
        poiRepository.saveAll(byId.values());
        poiRepository.flush();
    }
}
