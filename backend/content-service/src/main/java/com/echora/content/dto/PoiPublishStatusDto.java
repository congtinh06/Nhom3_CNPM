package com.echora.content.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiPublishStatusDto {
    private Long poiId;
    private String poiCode;
    private String publishStatus;   // PENDING, PUBLISHED, FAILED
    private Integer publishAttempts;
    private String lastPublishError;
    private LocalDateTime lastPublishAttemptAt;
}
