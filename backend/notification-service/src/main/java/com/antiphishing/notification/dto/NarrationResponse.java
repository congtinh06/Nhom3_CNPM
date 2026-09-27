package com.antiphishing.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarrationResponse {
    private String explanation;
    private String locale;
    private List<String> reasonCodesUsed;
}
