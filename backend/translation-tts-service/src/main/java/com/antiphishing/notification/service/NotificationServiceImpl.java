package com.antiphishing.notification.service;

import com.antiphishing.notification.client.NarrationClient;
import com.antiphishing.notification.dto.NarrationRequest;
import com.antiphishing.notification.dto.NarrationResponse;
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
import java.util.List;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;
    private final NarrationClient narrationClient;
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
                                   NarrationClient narrationClient,
                                   NotificationLogRepository logRepository) {
        this.mailSender = mailSender;
        this.narrationClient = narrationClient;
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

        // Sinh câu thuyết minh đa ngôn ngữ qua narration-service (có fallback an toàn)
        String explanation = buildExplanation(event);

        // 1. Gửi Email cảnh báo tới Quản trị viên hệ thống
        sendEmailAlert(event, adminEmail, explanation);

        // 2. Gửi Email thông báo tới người báo cáo nếu thông tin liên hệ là Email hợp lệ
        if (event.getReporterContact() != null && event.getReporterContact().contains("@")) {
            sendEmailAlert(event, event.getReporterContact(), explanation);
        }

        // 3. Gửi SMS demo qua Twilio nếu được bật
        if (smsEnabled) {
            sendSmsAlert(event, explanation);
        }
    }

    /**
     * Gọi narration-service để sinh câu thuyết minh theo locale của người nhận.
     * Nguyên tắc cô lập nguồn ngoài: nếu narration-service lỗi/không phản hồi,
     * vẫn gửi cảnh báo với nội dung mặc định, không làm gián đoạn luồng gửi.
     */
    private String buildExplanation(ReportCreatedEvent event) {
        try {
            NarrationRequest request = NarrationRequest.builder()
                    .reasonCodes(event.getReasonCodes() != null
                            ? event.getReasonCodes()
                            : List.of())
                    .riskScore(event.getRiskScore())
                    .locale(event.getLocale() != null && !event.getLocale().isBlank()
                            ? event.getLocale()
                            : "vi")
                    .build();

            NarrationResponse response = narrationClient.narrate(request);
            if (response != null && response.getExplanation() != null && !response.getExplanation().isBlank()) {
                log.info("Đã nhận thuyết minh từ narration-service (locale={}) cho Report ID: {}",
                        response.getLocale(), event.getReportId());
                return response.getExplanation();
            }
            log.warn("narration-service trả về rỗng cho Report ID: {}. Dùng nội dung mặc định.", event.getReportId());
        } catch (Exception e) {
            // Graceful degradation: không để lỗi 500 của service ngoài làm gián đoạn cảnh báo
            log.warn("Không thể gọi narration-service cho Report ID: {} ({}). Dùng nội dung mặc định.",
                    event.getReportId(), e.getMessage());
        }
        return buildDefaultExplanation(event);
    }

    private String buildDefaultExplanation(ReportCreatedEvent event) {
        return String.format(
                "Hệ thống phát hiện liên kết này có nguy cơ lừa đảo cao (Risk Score: %.2f).",
                event.getRiskScore() != null ? event.getRiskScore() : 1.0);
    }

    private void sendEmailAlert(ReportCreatedEvent event, String recipient, String explanation) {
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
                    "Phân tích chi tiết (ngôn ngữ: %s):\n" +
                    "%s\n\n" +
                    "Vui lòng kiểm tra và xử lý khóa tên miền khẩn cấp để bảo vệ người dùng.\n\n" +
                    "Hệ thống Brand Protection & Anti-Phishing",
                    event.getReportId(),
                    event.getTargetUrl(),
                    event.getChannel(),
                    event.getRiskScore() != null ? event.getRiskScore() : 1.0,
                    event.getCreatedAt() != null ? event.getCreatedAt().toString() : Instant.now().toString(),
                    event.getLocale() != null ? event.getLocale() : "vi",
                    explanation
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

    private void sendSmsAlert(ReportCreatedEvent event, String explanation) {
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

            String smsBody = String.format("[CANH BAO] Web mao danh: %s. Diem rui ro: %.2f. %s",
                    event.getTargetUrl(),
                    event.getRiskScore() != null ? event.getRiskScore() : 1.0,
                    shortenForSms(explanation));

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

    private String shortenForSms(String explanation) {
        if (explanation == null) {
            return "";
        }
        return explanation.length() <= 300 ? explanation : explanation.substring(0, 297) + "...";
    }
}
