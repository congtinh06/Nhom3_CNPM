package com.echora.content.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Tổng hợp trạng thái audio của toàn bộ POI theo 4 ngôn ngữ.
 * Dùng cho trang quản trị và script kiểm tra trước demo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAudioStatusDto {

    private LocalDateTime generatedAt;
    private int totalPois;
    private int readyLanguages;
    private int pendingLanguages;
    private int failedLanguages;
    private boolean allReady;
    private List<AdminAudioPoiDto> pois;
}
