package com.echora.content.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteDetailDto {
    private Long id;
    private Long zoneId;
    private String zoneCode;
    private String name;
    private String description;
    private Integer displayOrder;
    private String status;
    // Điểm dừng sắp theo stopOrder tăng dần
    private List<PoiSummaryDto> stops;
}
