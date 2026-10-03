package com.antiphishing.poi.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarrationDto {
    private String text;
    private String locale;
    private String ttsLang;
}
