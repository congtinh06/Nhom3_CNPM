package com.echora.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * Yêu cầu đổi trạng thái hiển thị của một POI (không đụng tới publish_status/audio).
 * ACTIVE    = hiển thị công khai
 * INACTIVE  = ẩn khỏi bản đồ và API công khai
 * MAINTENANCE = tạm dừng (vẫn lưu dữ liệu, không phục vụ du khách)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePoiStatusRequest {

    @NotBlank(message = "status không được để trống")
    @Pattern(
            regexp = "ACTIVE|INACTIVE|MAINTENANCE",
            message = "status phải là một trong: ACTIVE, INACTIVE, MAINTENANCE")
    private String status;
}
