package com.echora.location.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoiBoundingBoxDto {
    @JsonAlias({"id", "poiId"})
    private Long id;

    @JsonAlias({"code", "poiCode"})
    private String code;

    private String qrToken;
    private String name;
    private Long zoneId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer triggerRadiusMeters;

    public Long getPoiId() {
        return id;
    }

    public void setPoiId(Long poiId) {
        this.id = poiId;
    }

    public String getPoiCode() {
        return code;
    }

    public void setPoiCode(String poiCode) {
        this.code = poiCode;
    }

    public static class PoiBoundingBoxDtoBuilder {
        public PoiBoundingBoxDtoBuilder poiId(Long poiId) {
            this.id = poiId;
            return this;
        }

        public PoiBoundingBoxDtoBuilder poiCode(String poiCode) {
            this.code = poiCode;
            return this;
        }
    }
}
