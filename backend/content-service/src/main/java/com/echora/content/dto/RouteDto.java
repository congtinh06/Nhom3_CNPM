package com.echora.content.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteDto {
    private Long id;
    private Long zoneId;
    private String zoneCode;
    private String name;
    private String description;
    private Integer displayOrder;
    private String status;
    private long stopCount;
}
