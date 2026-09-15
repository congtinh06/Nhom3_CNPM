package com.antiphishing.notification.service;

import com.antiphishing.notification.dto.ReportCreatedEvent;
import com.antiphishing.notification.entity.NotificationLog;
import com.antiphishing.notification.repository.NotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NotificationLogRepository logRepository;

    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(mailSender, logRepository);
        ReflectionTestUtils.setField(notificationService, "adminEmail", "admin@bank-security.vn");
        ReflectionTestUtils.setField(notificationService, "smsEnabled", false);
    }

    @Test
    @DisplayName("Khi isPhishing = false -> không gửi email, không ghi log cảnh báo")
    void testHandle_WhenNotPhishing_ShouldDoNothing() {
        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(1L)
                .targetUrl("https://safe-bank.com")
                .isPhishing(false)
                .build();

        notificationService.handle(event);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("Khi isPhishing = true -> gửi email thành công và ghi log SENT vào database")
    void testHandle_WhenPhishing_ShouldSendEmailAndLogSuccess() {
        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(2L)
                .targetUrl("https://fake-bank-login.com")
                .channel("WEB")
                .reporterContact("reporter@example.com")
                .isPhishing(true)
                .riskScore(0.85)
                .createdAt(Instant.now())
                .build();

        notificationService.handle(event);

        // Gửi cho admin và gửi cho reporter (vì là email hợp lệ) -> tổng 2 lần
        verify(mailSender, times(2)).send(any(SimpleMailMessage.class));

        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository, times(2)).save(captor.capture());

        NotificationLog savedLog = captor.getAllValues().get(0);
        assertEquals(2L, savedLog.getReportId());
        assertEquals("EMAIL", savedLog.getChannel());
        assertEquals("SENT", savedLog.getStatus());
        assertNull(savedLog.getErrorMessage());
    }

    @Test
    @DisplayName("Khi gửi mail gặp sự cố -> vẫn ghi log FAILED với thông báo lỗi chi tiết")
    void testHandle_WhenMailFails_ShouldRecordFailedLog() {
        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(3L)
                .targetUrl("https://fake-bank-login.com")
                .channel("WEB")
                .reporterContact("0912345678") // không phải email -> chỉ gửi cho admin
                .isPhishing(true)
                .riskScore(0.90)
                .createdAt(Instant.now())
                .build();

        doThrow(new MailSendException("SMTP connection refused")).when(mailSender).send(any(SimpleMailMessage.class));

        notificationService.handle(event);

        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository, times(1)).save(captor.capture());

        NotificationLog failedLog = captor.getValue();
        assertEquals("FAILED", failedLog.getStatus());
        assertTrue(failedLog.getErrorMessage().contains("SMTP connection refused"));
    }
}
