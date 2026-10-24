package com.echora.content.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateZoneRequest {

    @NotBlank(message = "code is required")
    @Size(max = 50, message = "code must be at most 50 characters")
    private String code;

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must be at most 200 characters")
    private String name;

    private String description;

    @NotNull(message = "centerLat is required")
    @DecimalMin(value = "-90.0", message = "centerLat must be >= -90")
    @DecimalMax(value = "90.0", message = "centerLat must be <= 90")
    private BigDecimal centerLat;

    @NotNull(message = "centerLng is required")
    @DecimalMin(value = "-180.0", message = "centerLng must be >= -180")
    @DecimalMax(value = "180.0", message = "centerLng must be <= 180")
    private BigDecimal centerLng;

    @NotNull(message = "radiusMeters is required")
    @Min(value = 50, message = "radiusMeters must be at least 50 meters")
    @Max(value = 50000, message = "radiusMeters must be at most 50,000 meters")
    private Integer radiusMeters;
}
