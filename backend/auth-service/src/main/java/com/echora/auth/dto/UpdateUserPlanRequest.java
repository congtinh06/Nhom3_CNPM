package com.echora.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ============================================================================
 * DTO: YÊU CẦU CẬP NHẬT GÓI TÀI KHOẢN (Update User Plan Request DTO)
 * ============================================================================
 * 
 * Mục đích:
 * - Nhận dữ liệu từ form Quản trị viên khi thay đổi gói tài khoản người dùng.
 * - `plan`: 'FREE' hoặc 'PREMIUM'.
 * - `durationDays`: Số ngày hiệu lực khi nâng cấp (ví dụ 30, 90, 365 ngày; nếu null/0 thì tính vĩnh viễn hoặc mặc định).
 * ============================================================================
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserPlanRequest {

    @NotBlank(message = "Gói tài khoản không được để trống")
    private String plan;

    /** Số ngày sử dụng gói Premium khi kích hoạt (mặc định 365 ngày). */
    private Integer durationDays;
}
