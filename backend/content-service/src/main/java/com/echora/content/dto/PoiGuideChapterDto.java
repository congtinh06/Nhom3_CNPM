package com.echora.content.dto;

import lombok.*;

/**
 * Một phân đoạn (chap) bài thuyết minh của POI theo từng ngôn ngữ.
 * Tiếng Việt luôn miễn phí; ngoại ngữ bị khóa theo gói Premium hoặc mua lẻ POI
 * (service chỉ trả chap cho ngôn ngữ được phép, không đính kèm flag locked).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiGuideChapterDto {

    private Integer order;
    private String title;
    private String narrationText;
    private String audioUrl;
    private Integer audioDurationSeconds;
    private String audioStatus;
}
