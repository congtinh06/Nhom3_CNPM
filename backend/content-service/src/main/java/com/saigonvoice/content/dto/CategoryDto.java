package com.saigonvoice.content.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private Long id;
    private String code;
    private String nameVi;
    private String nameEn;
    private String iconUrl;
}
