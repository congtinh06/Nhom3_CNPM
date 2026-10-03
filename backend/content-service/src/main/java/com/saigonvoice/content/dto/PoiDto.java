package com.saigonvoice.content.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoiDto {
    private Object id;
    private String name;
    private String type;
    private String bankName;
    private String address;
    private double latitude;
    private double longitude;
}
