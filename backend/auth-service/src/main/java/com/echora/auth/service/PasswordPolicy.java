package com.echora.auth.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Quy tắc mật khẩu dùng chung giữa backend và frontend.
 * Yêu cầu: tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số.
 */
@Component
public class PasswordPolicy {

    public static final int MIN_LENGTH = 8;
    /** ChốngDoS: không cho hash bcrypt quá dài. */
    public static final int MAX_LENGTH = 128;

    public List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null || password.isEmpty()) {
            errors.add("Mật khẩu không được để trống.");
            return errors;
        }
        if (password.length() < MIN_LENGTH) {
            errors.add("Mật khẩu phải có ít nhất " + MIN_LENGTH + " ký tự.");
        }
        if (password.length() > MAX_LENGTH) {
            errors.add("Mật khẩu không được dài quá " + MAX_LENGTH + " ký tự.");
        }
        if (!containsUppercase(password)) {
            errors.add("Mật khẩu phải có ít nhất một chữ hoa (A-Z).");
        }
        if (!containsLowercase(password)) {
            errors.add("Mật khẩu phải có ít nhất một chữ thường (a-z).");
        }
        if (!containsDigit(password)) {
            errors.add("Mật khẩu phải có ít nhất một chữ số (0-9).");
        }
        return errors;
    }

    public boolean isValid(String password) {
        return validate(password).isEmpty();
    }

    private boolean containsUppercase(String value) {
        return value.chars().anyMatch(Character::isUpperCase);
    }

    private boolean containsLowercase(String value) {
        return value.chars().anyMatch(Character::isLowerCase);
    }

    private boolean containsDigit(String value) {
        return value.chars().anyMatch(Character::isDigit);
    }
}
