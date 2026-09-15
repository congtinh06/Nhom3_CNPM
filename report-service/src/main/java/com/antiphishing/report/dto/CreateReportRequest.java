package com.antiphishing.report.dto;

import com.antiphishing.report.entity.ReportChannel;
import com.antiphishing.report.validator.ValidReporterContact;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ValidReporterContact
public class CreateReportRequest {

    @NotBlank(message = "Target URL không được để trống")
    @URL(protocol = "http|https", message = "Target URL phải là địa chỉ web hợp lệ (bắt đầu bằng http:// hoặc https://)")
    private String targetUrl;

    @NotNull(message = "Kênh báo cáo không được để trống (giá trị hợp lệ: WEB hoặc SMS)")
    private ReportChannel channel;

    @NotBlank(message = "Thông tin liên hệ người báo cáo không được để trống")
    private String reporterContact;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String description;
}
