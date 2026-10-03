package com.saigonvoice.analytics.validator;

import com.saigonvoice.analytics.dto.CreateReportRequest;
import com.saigonvoice.analytics.entity.ReportChannel;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class ReporterContactValidator implements ConstraintValidator<ValidReporterContact, CreateReportRequest> {

    // Regex email tiêu chuẩn RFC 5322 cơ bản
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // Regex số điện thoại di động (chấp nhận chuẩn Việt Nam và quốc tế E.164)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "^(\\+?[0-9]{8,15})$"
    );

    @Override
    public boolean isValid(CreateReportRequest req, ConstraintValidatorContext context) {
        if (req == null) return true;
        if (req.getChannel() == null || req.getReporterContact() == null) {
            return true; // Các annotation @NotNull, @NotBlank ở cấp trường sẽ bắt lỗi này
        }

        String contact = req.getReporterContact().trim();

        if (req.getChannel() == ReportChannel.WEB) {
            if (!EMAIL_PATTERN.matcher(contact).matches()) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("Khi kênh là WEB, thông tin liên hệ phải là địa chỉ Email hợp lệ (ví dụ: user@example.com)")
                        .addPropertyNode("reporterContact")
                        .addConstraintViolation();
                return false;
            }
        } else if (req.getChannel() == ReportChannel.SMS) {
            if (!PHONE_PATTERN.matcher(contact).matches()) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("Khi kênh là SMS, thông tin liên hệ phải là số điện thoại hợp lệ từ 8-15 chữ số (ví dụ: +84912345678 hoặc 0912345678)")
                        .addPropertyNode("reporterContact")
                        .addConstraintViolation();
                return false;
            }
        }

        return true;
    }
}
