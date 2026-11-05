package com.echora.content.dto;

import lombok.*;

import java.util.List;

/** Trạng thái audio của một POI trong bảng kiểm tra trước demo. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAudioPoiDto {

    private Long id;
    private String code;
    private String name;
    private String status;
    private String publishStatus;
    private boolean allReady;
    private List<AdminPoiLanguageDto> languages;
}
