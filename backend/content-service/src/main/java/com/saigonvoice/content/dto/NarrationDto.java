package com.saigonvoice.content.dto;

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
