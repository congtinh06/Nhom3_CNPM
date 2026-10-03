package com.saigonvoice.location.client;

import com.saigonvoice.location.dto.PoiBoundingBoxDto;
import com.saigonvoice.location.dto.PoiInternalQrDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.List;

@FeignClient(
        name = "content-service-client",
        url = "${content-service.url}",
        configuration = ContentServiceClientConfiguration.class
)
public interface ContentServiceClient {

    @GetMapping("/api/content/internal/pois/bounding-box")
    List<PoiBoundingBoxDto> getPoisInBoundingBox(
            @RequestParam(value = "zoneId", required = false) Long zoneId,
            @RequestParam("minLat") BigDecimal minLat,
            @RequestParam("maxLat") BigDecimal maxLat,
            @RequestParam("minLng") BigDecimal minLng,
            @RequestParam("maxLng") BigDecimal maxLng
    );

    @GetMapping("/api/content/internal/pois/qr/{qrToken}")
    PoiInternalQrDto getPoiByQrToken(@PathVariable("qrToken") String qrToken);
}
