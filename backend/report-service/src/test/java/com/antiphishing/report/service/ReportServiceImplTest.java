package com.antiphishing.report.service;

import com.antiphishing.report.client.LinkVerificationClient;
import com.antiphishing.report.dto.CreateReportRequest;
import com.antiphishing.report.dto.ReportResponse;
import com.antiphishing.report.dto.VerifyResponse;
import com.antiphishing.report.entity.Report;
import com.antiphishing.report.entity.ReportChannel;
import com.antiphishing.report.entity.ReportStatus;
import com.antiphishing.report.messaging.ReportCreatedEvent;
import com.antiphishing.report.messaging.ReportEventPublisher;
import com.antiphishing.report.repository.ReportRepository;
import feign.FeignException;
import feign.Request;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private ReportRepository repository;

    @Mock
    private LinkVerificationClient linkVerificationClient;

    @Mock
    private ReportEventPublisher eventPublisher;

    private ReportServiceImpl reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportServiceImpl(repository, linkVerificationClient, eventPublisher);
    }

    @Test
    @DisplayName("Tạo báo cáo thành công khi Feign client trả về kết quả hợp lệ")
    void testCreateReport_SuccessWithVerification() {
        CreateReportRequest request = CreateReportRequest.builder()
                .targetUrl("https://fake-bank.com/login")
                .channel(ReportChannel.WEB)
                .reporterContact("user@gmail.com")
                .description("Web mạo danh")
                .build();

        VerifyResponse mockVerifyResponse = VerifyResponse.builder()
                .url("https://fake-bank.com/login")
                .domain("fake-bank.com")
                .isPhishing(true)
                .riskScore(0.67)
                .sources(List.of("PHISHUNT"))
                .checkedAt(Instant.now())
                .build();

        when(linkVerificationClient.verify(any())).thenReturn(mockVerifyResponse);

        when(repository.save(any(Report.class))).thenAnswer(invocation -> {
            Report r = invocation.getArgument(0);
            r.setId(100L);
            return r;
        });

        ReportResponse response = reportService.createReport(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(ReportStatus.VERIFIED, response.getStatus());
        assertTrue(response.getIsPhishing());
        assertEquals(0.67, response.getRiskScore());

        verify(eventPublisher, times(1)).publish(any(ReportCreatedEvent.class));
    }

    @Test
    @DisplayName("Graceful Degradation: Khi Feign client lỗi (service down), lưu PENDING và không ném lỗi 500")
    void testCreateReport_WhenFeignFails_ShouldFallbackToPending() {
        CreateReportRequest request = CreateReportRequest.builder()
                .targetUrl("https://fake-bank.com/login")
                .channel(ReportChannel.SMS)
                .reporterContact("0912345678")
                .description("Tin nhắn SMS giả")
                .build();

        Request feignReq = Request.create(Request.HttpMethod.POST, "/api/v1/verify", Collections.emptyMap(), null, null, null);
        when(linkVerificationClient.verify(any())).thenThrow(new FeignException.ServiceUnavailable("Service Down", feignReq, null, null));

        when(repository.save(any(Report.class))).thenAnswer(invocation -> {
            Report r = invocation.getArgument(0);
            r.setId(101L);
            return r;
        });

        ReportResponse response = reportService.createReport(request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(ReportStatus.PENDING, response.getStatus());
        assertNull(response.getIsPhishing());
        assertNull(response.getRiskScore());

        ArgumentCaptor<Report> captor = ArgumentCaptor.forClass(Report.class);
        verify(repository, times(1)).save(captor.capture());
        assertEquals(ReportStatus.PENDING, captor.getValue().getStatus());

        verify(eventPublisher, times(1)).publish(any(ReportCreatedEvent.class));
    }
}
