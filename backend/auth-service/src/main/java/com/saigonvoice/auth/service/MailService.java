package com.saigonvoice.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Gửi email xác thực tài khoản và đặt lại mật khẩu.
 *
 * <p>Chưa cấu hình {@code MAIL_HOST} (local/offline) thì không tạo {@code JavaMailSender},
 * toàn bộ email được ghi ra log kèm link để dev kiểm thử. Khi đã cấu hình SMTP thật thì
 * token KHÔNG BAO GIỜ được ghi vào log — chỉ ghi lỗi gửi mail.</p>
 */
@Service
@Slf4j
public class MailService {

    private final JavaMailSenderImpl mailSender;
    private final boolean smtpConfigured;
    private final String from;
    private final String frontendUrl;

    public MailService(@Value("${app.mail.host:}") String host,
                       @Value("${app.mail.port:587}") int port,
                       @Value("${app.mail.username:}") String username,
                       @Value("${app.mail.password:}") String password,
                       @Value("${app.mail.start-tls:true}") boolean startTls,
                       @Value("${app.mail.from:Echora <no-reply@echora.local>}") String from,
                       @Value("${app.security.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.from = from;
        this.frontendUrl = frontendUrl;
        this.smtpConfigured = host != null && !host.isBlank();
        if (this.smtpConfigured) {
            this.mailSender = new JavaMailSenderImpl();
            this.mailSender.setHost(host.trim());
            this.mailSender.setPort(port);
            if (username != null && !username.isBlank()) {
                this.mailSender.setUsername(username.trim());
                this.mailSender.setPassword(password == null ? "" : password);
            }
            this.mailSender.setDefaultEncoding(StandardCharsets.UTF_8.name());
            java.util.Properties props = this.mailSender.getJavaMailProperties();
            props.put("mail.smtp.auth", String.valueOf(username != null && !username.isBlank()));
            props.put("mail.smtp.starttls.enable", String.valueOf(startTls));
            props.put("mail.smtp.connectiontimeout", "5000");
            props.put("mail.smtp.timeout", "5000");
            props.put("mail.smtp.writetimeout", "5000");
            log.info("SMTP đã cấu hình tại {}:{}", host.trim(), port);
        } else {
            this.mailSender = null;
            log.warn("MAIL_HOST chưa được cấu hình. Email xác thực/đặt lại mật khẩu sẽ được ghi ra log (chỉ dùng khi phát triển).");
        }
    }

    public boolean isSmtpConfigured() {
        return smtpConfigured;
    }

    public String buildVerifyLink(String token) {
        return frontendUrl + "/xac-thuc-email?token=" + token;
    }

    public String buildResetLink(String token) {
        return frontendUrl + "/dat-lai-mat-khau?token=" + token;
    }

    public void sendVerificationEmail(String to, String token) {
        String link = buildVerifyLink(token);
        String subject = "Xác thực địa chỉ email Echora";
        String body = "Xin chào,\n\n"
                + "Vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào link sau "
                + "(hiệu lực trong 24 giờ, dùng một lần):\n"
                + link + "\n\n"
                + "Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.";
        send(to, subject, body, link, "xác thực email");
    }

    public void sendPasswordResetEmail(String to, String token) {
        String link = buildResetLink(token);
        String subject = "Đặt lại mật khẩu Echora";
        String body = "Xin chào,\n\n"
                + "Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Nhấn vào link sau "
                + "(hiệu lực trong 20 phút, dùng một lần):\n"
                + link + "\n\n"
                + "Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn không thay đổi.";
        send(to, subject, body, link, "đặt lại mật khẩu");
    }

    private void send(String to, String subject, String body, String link, String purpose) {
        if (!smtpConfigured) {
            log.warn("[MAIL FALLBACK - smtp chưa cấu hình] purpose={} to={} link={}", purpose, to, link);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Đã gửi email {} tới {}", purpose, to);
        } catch (RuntimeException ex) {
            // Không in link/token ra log khi SMTP đã được cấu hình
            log.error("Không gửi được email {} tới {}: {}", purpose, to, ex.getMessage());
        }
    }
}
