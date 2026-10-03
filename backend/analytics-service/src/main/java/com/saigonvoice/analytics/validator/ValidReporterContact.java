package com.saigonvoice.analytics.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ReporterContactValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidReporterContact {
    String message() default "Thông tin liên hệ không khớp với kênh đã chọn (Kênh WEB yêu cầu Email hợp lệ, Kênh SMS yêu cầu Số điện thoại hợp lệ)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
