package com.echora.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetEventsResponse {

    /** Số dòng đã xoá khỏi bảng analytics_event. */
    private long deleted;

    private String message;
}
