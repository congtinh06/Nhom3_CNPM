package com.saigonvoice.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

/** Cập nhật thông tin tuyến (không bao gồm danh sách điểm dừng). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRouteRequest {

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must be <= 200 characters")
    private String name;

    private String description;

    @PositiveOrZero(message = "displayOrder must be >= 0")
    private Integer displayOrder;

    @Size(max = 30, message = "status must be <= 30 characters")
    private String status;

    private Long version;
}
