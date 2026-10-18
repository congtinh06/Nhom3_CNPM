package com.saigonvoice.content.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Chi tiết POI cho admin: gồm tất cả bản dịch trong 1 response. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPoiDetailDto {

    private Long id;
    private String code;
    private String qrToken;
    private String name;
    private String slug;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer triggerRadiusMeters;
    private String address;
    private String thumbnailUrl;

    private Long zoneId;
    private String zoneCode;

    private Long categoryId;
    private String categoryCode;
    private String categoryNameVi;

    private Long routeId;
    private String routeName;
    private Integer stopOrder;

    private String status;
    private Long version;

    private String publishStatus;
    private Integer publishAttempts;
    private LocalDateTime lastPublishAttemptAt;

    private String overallStatus;
    private List<String> attentionReasons;
    private AdminPoiLanguageSummaryDto languageSummary;
    private List<AdminPoiLanguageDto> languages;

    // Tất cả bản dịch, key = languageCode (vi/en/ja/ko).
    private Map<String, AdminPoiTranslationDto> translations;
}
