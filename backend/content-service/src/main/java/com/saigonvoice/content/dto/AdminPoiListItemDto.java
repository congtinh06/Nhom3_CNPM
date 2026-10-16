package com.saigonvoice.content.dto;

import lombok.*;

import java.util.Map;

/** Một dòng trong danh sách POI cho admin (server-side phân trang). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPoiListItemDto {

    private Long id;
    private String code;
    private String name;
    private String slug;

    private Long zoneId;
    private String zoneCode;

    private Long routeId;
    private String routeName;
    private Integer stopOrder;

    private String status;
    private Long version;
    private String publishStatus;

    // audioStatus theo ngôn ngữ (vi/en/ja/ko) — chỉ chứa ngôn ngữ đã có bản dịch.
    private Map<String, String> audioStatusByLanguage;
}
