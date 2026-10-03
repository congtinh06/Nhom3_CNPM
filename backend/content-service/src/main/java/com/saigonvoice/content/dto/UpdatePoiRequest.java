package com.saigonvoice.content.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePoiRequest {

    @NotNull(message = "categoryId is required")
    private Long categoryId;

    @NotBlank(message = "name is required")
    @Size(max = 255, message = "name must be at most 255 characters")
    private String name;

    @NotNull(message = "latitude is required")
    @DecimalMin(value = "-90.0", message = "latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "latitude must be <= 90")
    private BigDecimal latitude;

    @NotNull(message = "longitude is required")
    @DecimalMin(value = "-180.0", message = "longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "longitude must be <= 180")
    private BigDecimal longitude;

    @Min(value = 1, message = "triggerRadiusMeters must be >= 1")
    private Integer triggerRadiusMeters;

    @Size(max = 500, message = "address must be at most 500 characters")
    private String address;

    @Size(max = 500, message = "thumbnailUrl must be at most 500 characters")
    private String thumbnailUrl;

    // Vietnamese content fields
    @NotBlank(message = "title is required")
    @Size(max = 255, message = "title must be at most 255 characters")
    private String title;

    @NotBlank(message = "summary is required")
    @Size(max = 1000, message = "summary must be at most 1000 characters")
    private String summary;

    @NotBlank(message = "description is required")
    private String description;

    private String historicalSignificance;
}
