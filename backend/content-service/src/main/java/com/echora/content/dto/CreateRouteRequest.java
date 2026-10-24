package com.echora.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRouteRequest {

    @NotNull(message = "zoneId is required")
    private Long zoneId;

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must be <= 200 characters")
    private String name;

    private String description;

    @PositiveOrZero(message = "displayOrder must be >= 0")
    @Builder.Default
    private Integer displayOrder = 0;
}
