package com.echora.content.event;

import lombok.*;

import java.io.Serializable;

/**
 * Văn bản do người viết cho một ngôn ngữ (translation_source = MANUAL).
 * Được gửi kèm event publish để translation-tts-service dùng nguyên văn thay vì dịch máy.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthoredPoiText implements Serializable {
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
}
