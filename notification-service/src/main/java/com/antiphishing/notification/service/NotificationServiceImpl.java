package com.antiphishing.notification.service;

import com.antiphishing.notification.dto.ReportCreatedEvent;
import com.antiphishing.notification.entity.NotificationLog;
import com.antiphishing.notification.repository.NotificationLogRepository;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationLogRepository logRepository;

    @Value("${notification.admin-email:admin@anti-phishing-bank.example.com}")
    private String adminEmail;

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${twilio.from-number:}")
    private String twilioFromNumber;

    @Value("${twilio.to-number-demo:}")
    private String twilioToNumberDemo;

    public NotificationServiceImpl(JavaMailSender mailSender,
                                   NotificationLogRepository logRepository) {
        this.mailSender = mailSender;
        this.logRepository = logRepository;
    }

    @Override
    public void handle(ReportCreatedEvent event) {
        log.info("Xử lý sự kiện ReportCreatedEvent cho Report ID: {}", event.getReportId());

        // Nếu không phát hiện lừa đảo, không kích hoạt gửi cảnh báo khẩn cấp
        if (!Boolean.TRUE.equals(event.getIsPhishing())) {
            log.info("Báo cáo ID {} có kết quả an toàn. Bỏ qua gửi email cảnh báo khẩn cấp.", event.getReportId());
            return;
        }

        // 1. Gửi Email cảnh báo tới Quản trị viên hệ thống
        sendEmailAlert(event, adminEmail);

        // 2. Gửi Email thông báo tới người báo cáo nếu thông tin liên hệ là Email hợp lệ
        if (event.getReporterContact() != null && event.getReporterContact().contains("@")) {
            sendEmailAlert(event, event.getReporterContact());
        }

        // 3. Gửi SMS demo qua Twilio nếu được bật
        if (smsEnabled) {
            sendSmsAlert(event);
        }
    }

    private void sendEmailAlert(ReportCreatedEvent event, String recipient) {
        NotificationLog notificationLog = NotificationLog.builder()
                .reportId(event.getReportId())
                .channel("EMAIL")
                .recipient(recipient)
                .sentAt(Instant.now())
                .build();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipient);
            message.setSubject("[CẢNH BÁO PHISHING] Phát hiện website/SMS mạo danh ngân hàng");
            message.setText(String.format(
                    "Kính gửi Quản trị viên/Người dùng,\n\n" +
                    "Hệ thống phát hiện một liên kết có nguy cơ lừa đảo cao:\n" +
                    "- Mã báo cáo: #%d\n" +
                    "- Liên kết nguy hại: %s\n" +
                    "- Kênh tiếp nhận: %s\n" +
                    "- Điểm rủi ro (Risk Score): %.2f\n" +
                    "- Thời gian phát hiện: %s\n\n" +
                    "Vui lòng kiểm tra và xử lý khóa tên miền khẩn cấp để bảo vệ người dùng.\n\n" +
                    "Hệ thống Brand Protection & Anti-Phishing",
                    event.getReportId(),
                    event.getTargetUrl(),
                    event.getChannel(),
                    event.getRiskScore() != null ? event.getRiskScore() : 1.0,
                    event.getCreatedAt() != null ? event.getCreatedAt().toString() : Instant.now().toString()
            ));

            mailSender.send(message);
            notificationLog.setStatus("SENT");
            log.info("Đã gửi thành công Email cảnh báo tới: {}", recipient);
        } catch (Exception e) {
            log.error("Gửi Email cảnh báo tới {} thất bại: {}", recipient, e.getMessage());
            notificationLog.setStatus("FAILED");
            notificationLog.setErrorMessage(e.getMessage());
        }

        // Ràng buộc Audit: Luôn ghi log lịch sử gửi
        logRepository.save(notificationLog);
    }

    private void sendSmsAlert(ReportCreatedEvent event) {
        String targetPhone = (twilioToNumberDemo != null && !twilioToNumberDemo.isBlank())
                ? twilioToNumberDemo
                : event.getReporterContact();

        NotificationLog notificationLog = NotificationLog.builder()
                .reportId(event.getReportId())
                .channel("SMS")
                .recipient(targetPhone)
                .sentAt(Instant.now())
                .build();

        try {
            if (twilioFromNumber == null || twilioFromNumber.isBlank()) {
                throw new IllegalStateException("Số điện thoại gửi Twilio chưa được thiết lập.");
            }

            String smsBody = String.format("[CANH BAO] Phat hien web mao danh ngan hang: %s. Diem rui ro: %.2f",
                    event.getTargetUrl(), event.getRiskScore() != null ? event.getRiskScore() : 1.0);

            Message.creator(
                    new PhoneNumber(targetPhone),
                    new PhoneNumber(twilioFromNumber),
                    smsBody
            ).create();

            notificationLog.setStatus("SENT");
            log.info("Đã gửi tin nhắn SMS Twilio tới: {}", targetPhone);
        } catch (Exception e) {
            log.warn("Không thể gửi SMS demo qua Twilio: {}", e.getMessage());
            notificationLog.setStatus("FAILED");
            notificationLog.setErrorMessage(e.getMessage());
        }

        // Luôn ghi log audit cho kênh SMS
        logRepository.save(notificationLog);
    }
}
