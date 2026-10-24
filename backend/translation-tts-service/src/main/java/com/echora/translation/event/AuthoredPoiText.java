package com.echora.translation.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.io.Serializable;

/**
 * Văn bản do người viết cho một ngôn ngữ (content-service gửi kèm khi translation_source = MANUAL).
 * Pipeline dùng nguyên văn thay vì gọi nhà cung cấp dịch máy.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class AuthoredPoiText implements Serializable {
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
}
