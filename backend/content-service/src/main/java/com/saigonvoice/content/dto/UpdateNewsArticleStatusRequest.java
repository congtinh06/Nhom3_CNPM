package com.saigonvoice.content.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNewsArticleStatusRequest {

    @NotNull(message = "Trạng thái hiển thị không được để trống")
    private Boolean isActive;
}
