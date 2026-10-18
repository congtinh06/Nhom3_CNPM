package com.saigonvoice.content.dto;

import lombok.*;

/** Tổng hợp nhanh trạng thái thuyết minh theo số lượng ngôn ngữ. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPoiLanguageSummaryDto {

    private int total;
    private int ready;
    private int pending;
    private int failed;
}
