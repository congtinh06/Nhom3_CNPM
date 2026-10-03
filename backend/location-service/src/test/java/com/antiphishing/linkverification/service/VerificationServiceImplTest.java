package com.antiphishing.linkverification.service;

import com.antiphishing.linkverification.client.GoogleSafeBrowsingClient;
import com.antiphishing.linkverification.client.MockPhishingClient;
import com.antiphishing.linkverification.client.PhishTankClient;
import com.antiphishing.linkverification.client.PhishuntClient;
import com.antiphishing.linkverification.dto.VerifyRequest;
import com.antiphishing.linkverification.dto.VerifyResponse;
import com.antiphishing.linkverification.entity.VerificationResult;
import com.antiphishing.linkverification.repository.VerificationResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationServiceImplTest {

    @Mock
    private PhishuntClient phishuntClient;

    @Mock
    private GoogleSafeBrowsingClient googleSafeBrowsingClient;

    @Mock
    private PhishTankClient phishTankClient;

    @Mock
    private MockPhishingClient mockPhishingClient;

    @Mock
    private VerificationResultRepository repository;

    private VerificationServiceImpl verificationService;

    @BeforeEach
    void setUp() {
        verificationService = new VerificationServiceImpl(
                phishuntClient,
                googleSafeBrowsingClient,
                phishTankClient,
                mockPhishingClient,
                new ReasonCodeDetector(),
                repository
        );
    }

    @Test
    @DisplayName("Khi Phishunt gắn cờ URL độc hại -> isPhishing = true và lưu vào Database")
    void testVerify_WhenPhishuntFlags_ShouldReturnPhishingTrue() {
        String testUrl = "https://example-fake-bank.com/login";
        when(phishuntClient.isFlagged(testUrl)).thenReturn(true);
        when(googleSafeBrowsingClient.isFlagged(testUrl)).thenReturn(false);
        when(phishTankClient.isFlagged(testUrl)).thenReturn(false);
        when(mockPhishingClient.isMockMode()).thenReturn(false);

        VerifyRequest request = new VerifyRequest(testUrl);
        VerifyResponse response = verificationService.verify(request);

        assertNotNull(response);
        assertTrue(response.isPhishing());
        assertEquals("example-fake-bank.com", response.getDomain());
        assertTrue(response.getRiskScore() > 0.0);
        assertTrue(response.getSources().contains("PHISHUNT"));
        // URL giả mạo chứa thương hiệu ngân hàng phải sinh được reason code tương ứng
        assertTrue(response.getReasonCodes().contains("BLACKLISTED_DOMAIN"));
        assertTrue(response.getReasonCodes().contains("BRAND_KEYWORD_MATCH"));

        ArgumentCaptor<VerificationResult> captor = ArgumentCaptor.forClass(VerificationResult.class);
        verify(repository, times(1)).save(captor.capture());

        VerificationResult savedEntity = captor.getValue();
        assertEquals(testUrl, savedEntity.getUrl());
        assertTrue(savedEntity.isPhishing());
        assertTrue(savedEntity.getReasonCodes().contains("BLACKLISTED_DOMAIN"));
    }

    @Test
    @DisplayName("URL http:// rút gọn -> sinh reason codes NO_HTTPS và SHORT_URL_OBFUSCATION")
    void testVerify_ShouldDeriveStructuralReasonCodes() {
        String testUrl = "http://bit.ly/abc123";
        when(phishuntClient.isFlagged(testUrl)).thenReturn(false);
        when(googleSafeBrowsingClient.isFlagged(testUrl)).thenReturn(false);
        when(phishTankClient.isFlagged(testUrl)).thenReturn(false);
        when(mockPhishingClient.isMockMode()).thenReturn(false);

        VerifyRequest request = new VerifyRequest(testUrl);
        VerifyResponse response = verificationService.verify(request);

        assertNotNull(response);
        assertTrue(response.getReasonCodes().contains("NO_HTTPS"));
        assertTrue(response.getReasonCodes().contains("SHORT_URL_OBFUSCATION"));
        assertFalse(response.getReasonCodes().contains("BLACKLISTED_DOMAIN"));
    }

    @Test
    @DisplayName("Khi tất cả client trả về an toàn -> isPhishing = false")
    void testVerify_WhenAllClean_ShouldReturnPhishingFalse() {
        String testUrl = "https://official-bank.com/home";
        when(phishuntClient.isFlagged(testUrl)).thenReturn(false);
        when(googleSafeBrowsingClient.isFlagged(testUrl)).thenReturn(false);
        when(phishTankClient.isFlagged(testUrl)).thenReturn(false);
        when(mockPhishingClient.isMockMode()).thenReturn(false);

        VerifyRequest request = new VerifyRequest(testUrl);
        VerifyResponse response = verificationService.verify(request);

        assertNotNull(response);
        assertFalse(response.isPhishing());
        assertEquals(0.0, response.getRiskScore());
        assertTrue(response.getSources().isEmpty());
        verify(repository, times(1)).save(any(VerificationResult.class));
    }
}
