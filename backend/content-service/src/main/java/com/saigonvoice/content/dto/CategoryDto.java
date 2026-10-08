package com.saigonvoice.content.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

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
    private Long parentId;
    @Builder.Default
    private List<CategoryDto> children = new ArrayList<>();
}
