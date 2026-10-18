package com.saigonvoice.content.dto;

import lombok.*;

import java.time.LocalDateTime;

/** Trạng thái thuyết minh của một ngôn ngữ cho trang quản trị. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPoiLanguageDto {

    private String languageCode;
    private String languageName;
    private String audioStatus;
    private Integer audioDurationSeconds;
    private String errorReason;
    private LocalDateTime lastAttemptAt;
}
