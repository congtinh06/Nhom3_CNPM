package com.echora.content.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Thay toàn bộ danh sách điểm dừng của tuyến.
 * Thứ tự phần tử trong poiIds chính là stop_order (1, 2, 3...).
 * Danh sách rỗng = gỡ hết POI khỏi tuyến.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRouteStopsRequest {

    @NotNull(message = "poiIds is required")
    @Builder.Default
    private List<Long> poiIds = new ArrayList<>();

    private Long version;
}
