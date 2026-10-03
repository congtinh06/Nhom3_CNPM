package com.saigonvoice.translation.service;

import com.saigonvoice.translation.client.NarrationClient;
import com.saigonvoice.translation.dto.NarrationRequest;
import com.saigonvoice.translation.dto.NarrationResponse;
import com.saigonvoice.translation.dto.ReportCreatedEvent;
import com.saigonvoice.translation.entity.NotificationLog;
import com.saigonvoice.translation.repository.NotificationLogRepository;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NarrationClient narrationClient;

    @Mock
    private NotificationLogRepository logRepository;

    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(mailSender, narrationClient, logRepository);
        ReflectionTestUtils.setField(notificationService, "adminEmail", "admin@bank-security.vn");
        ReflectionTestUtils.setField(notificationService, "smsEnabled", false);
    }

    private ReportCreatedEvent phishingEvent() {
        return ReportCreatedEvent.builder()
                .reportId(2L)
                .targetUrl("https://fake-bank-login.com")
                .channel("WEB")
                .reporterContact("reporter@example.com")
                .isPhishing(true)
                .riskScore(0.85)
                .reasonCodes(List.of("BRAND_KEYWORD_MATCH", "BLACKLISTED_DOMAIN"))
                .locale("vi")
                .createdAt(Instant.now())
                .build();
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

        verify(narrationClient, never()).narrate(any());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("Khi phishing -> gọi narration-service và ghép câu thuyết minh vào email")
    void testHandle_WhenPhishing_ShouldEmbedNarrationInEmail() {
        when(narrationClient.narrate(any(NarrationRequest.class))).thenReturn(NarrationResponse.builder()
                .explanation("Địa chỉ chứa từ khóa giả danh thương hiệu ngân hàng, tên miền đã nằm trong danh sách đen.")
                .locale("vi")
                .reasonCodesUsed(List.of("BRAND_KEYWORD_MATCH", "BLACKLISTED_DOMAIN"))
                .build());

        notificationService.handle(phishingEvent());

        ArgumentCaptor<NarrationRequest> narrationCaptor = ArgumentCaptor.forClass(NarrationRequest.class);
        verify(narrationClient, times(1)).narrate(narrationCaptor.capture());
        NarrationRequest sentRequest = narrationCaptor.getValue();
        assertEquals(List.of("BRAND_KEYWORD_MATCH", "BLACKLISTED_DOMAIN"), sentRequest.getReasonCodes());
        assertEquals("vi", sentRequest.getLocale());

        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(2)).send(mailCaptor.capture());
        assertTrue(mailCaptor.getAllValues().get(0).getText()
                .contains("Địa chỉ chứa từ khóa giả danh thương hiệu ngân hàng"));

        verify(logRepository, times(2)).save(any(NotificationLog.class));
    }

    @Test
    @DisplayName("Graceful Degradation: narration-service lỗi -> vẫn gửi email với nội dung mặc định")
    void testHandle_WhenNarrationFails_ShouldFallbackAndStillSend() {
        when(narrationClient.narrate(any(NarrationRequest.class)))
                .thenThrow(new RuntimeException("connection refused"));

        notificationService.handle(phishingEvent());

        // Vẫn gửi đủ 2 email (admin + reporter) dù narration-service đã sập
        ArgumentCaptor<SimpleMailMessage> mailCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(2)).send(mailCaptor.capture());
        assertTrue(mailCaptor.getAllValues().get(0).getText().contains("nguy cơ lừa đảo cao"));
        assertFalse(mailCaptor.getAllValues().get(0).getText().contains("thuyết minh"));

        verify(logRepository, times(2)).save(any(NotificationLog.class));
    }

    @Test
    @DisplayName("Khi gửi mail gặp sự cố -> vẫn ghi log FAILED với thông báo lỗi chi tiết")
    void testHandle_WhenMailFails_ShouldRecordFailedLog() {
        when(narrationClient.narrate(any(NarrationRequest.class))).thenReturn(NarrationResponse.builder()
                .explanation("Explanation text")
                .locale("vi")
                .build());

        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(3L)
                .targetUrl("https://fake-bank-login.com")
                .channel("WEB")
                .reporterContact("0912345678") // không phải email -> chỉ gửi cho admin
                .isPhishing(true)
                .riskScore(0.90)
                .locale("vi")
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
