package com.saigonvoice.content.dto;

import lombok.*;

/** Một dòng trong danh sách tuyến cho admin (server-side phân trang). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRouteListItemDto {

    private Long id;
    private Long zoneId;
    private String zoneCode;
    private String zoneName;
    private String name;
    private Integer displayOrder;
    private String status;
    private long stopCount;
    private Long version;
}
