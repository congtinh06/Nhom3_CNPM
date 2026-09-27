package com.antiphishing.narration.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarrationRequest {

    @NotEmpty(message = "reasonCodes must not be empty")
    private List<String> reasonCodes;

    private Double riskScore;

    private String locale;
}
