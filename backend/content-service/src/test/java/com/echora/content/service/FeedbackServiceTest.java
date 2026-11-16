package com.echora.content.service;

import com.echora.content.dto.FeedbackDtos.SubmitRequest;
import com.echora.content.dto.FeedbackDtos.SubmitResponse;
import com.echora.content.entity.FeedbackMessage;
import com.echora.content.entity.FeedbackThread;
import com.echora.content.repository.FeedbackMessageRepository;
import com.echora.content.repository.FeedbackThreadRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock
    private FeedbackThreadRepository threads;

    @Mock
    private FeedbackMessageRepository messages;

    @InjectMocks
    private FeedbackService feedbackService;

    @Test
    void submitLinksThreadToAuthenticatedUserAndDoesNotExposeTrackingCode() {
        FeedbackThread savedThread = FeedbackThread.builder()
                .ticket("ticket-1")
                .name("Trần Minh")
                .email("minh@example.com")
                .tokenHash("hash")
                .ownerUserId(42L)
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(threads.save(any(FeedbackThread.class))).thenReturn(savedThread);
        when(messages.save(any(FeedbackMessage.class))).thenReturn(FeedbackMessage.builder()
                .thread(savedThread)
                .sender("CUSTOMER")
                .content("Nội dung đủ dài để gửi liên hệ cho Echora.")
                .createdAt(LocalDateTime.now())
                .build());

        SubmitResponse response = feedbackService.submit(
                new SubmitRequest("Trần Minh", "minh@example.com", "Nội dung đủ dài để gửi liên hệ cho Echora."),
                42L);

        ArgumentCaptor<FeedbackThread> threadCaptor = ArgumentCaptor.forClass(FeedbackThread.class);
        verify(threads).save(threadCaptor.capture());
        assertThat(threadCaptor.getValue().getOwnerUserId()).isEqualTo(42L);

        assertThat(response.success()).isTrue();
        assertThat(response.message()).doesNotContain("mã theo dõi");
        assertThat(response.message()).contains("gửi thành công");
        assertThat(response.ticket()).isNotBlank();
        assertThat(response.accessToken()).hasSize(64);
    }
}
