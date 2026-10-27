package com.echora.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ket qua kiem tra quyen truy cap mot POI theo ngon ngu.
 * Day la nguon duy nhat de content-service / translation-service quyet dinh
 * co mo khoa noi dung hay khong.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessResponse {

    private Long userId;
    private Long poiId;
    private String language;
    private boolean allowed;
    private boolean premium;
    private boolean poiUnlocked;
    private LocalDateTime expiresAt;
}
