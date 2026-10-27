package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiDetailDto {
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
    private String categoryCode;
    private Long routeId;
    private Integer stopOrder;

    // Multilingual detail fields
    private String languageCode;
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private String audioUrl;
    private Integer audioDurationSeconds;
    private String audioStatus; // PENDING, PROCESSING, READY, FAILED_TTS
    private boolean isFallbackLanguage;

    // Phân đoạn bài thuyết minh (chap) của ngôn ngữ đang truy vấn.
    private List<PoiGuideChapterDto> chapters;

    // Giá mua lẻ gói ngoại ngữ cho POI này (null = dùng giá mặc định phía order-service).
    private BigDecimal premiumPrice;
}
