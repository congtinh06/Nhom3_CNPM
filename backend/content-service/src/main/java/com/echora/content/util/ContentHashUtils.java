package com.echora.content.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

/**
 * Tiện ích tính hash nội dung (contentHash) thống nhất giữa content-service và translation-tts-service.
 * Sử dụng phân cách ký tự Unit Separator (\u001F) tránh mơ hồ khi nội dung chứa các ký tự đặc biệt.
 */
public final class ContentHashUtils {

    public static final String SEPARATOR = "\u001F";

    private ContentHashUtils() {
    }

    public static String computeHash(String targetLang, String title, String summary, String description, String historicalSignificance) {
        String cleanLang = clean(targetLang).toLowerCase(Locale.ROOT);
        String cleanTitle = clean(title);
        String cleanSummary = clean(summary);
        String cleanDesc = clean(description);
        String cleanHist = clean(historicalSignificance);

        String raw = cleanLang + SEPARATOR + cleanTitle + SEPARATOR + cleanSummary + SEPARATOR + cleanDesc + SEPARATOR + cleanHist;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public static String clean(String s) {
        return (s == null || s.trim().isEmpty()) ? "" : s.trim();
    }
}
