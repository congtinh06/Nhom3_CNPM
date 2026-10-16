package com.saigonvoice.content.dto;

import lombok.*;

import java.util.List;

/** Chi tiết tuyến cho admin: gồm danh sách điểm dừng theo stopOrder tăng dần. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRouteDetailDto {

    private Long id;
    private Long zoneId;
    private String zoneCode;
    private String zoneName;
    private String name;
    private String description;
    private Integer displayOrder;
    private String status;
    private long stopCount;
    private List<PoiSummaryDto> stops;
    private Long version;
}
