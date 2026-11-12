package com.echora.content.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class FeedbackDtos {

    private FeedbackDtos() {
    }

    public record SubmitRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 5000) String message
    ) {
    }

    public record ReplyRequest(@NotBlank @Size(min = 1, max = 5000) String message) {
    }

    public record MessageDto(Long id, String sender, String content, LocalDateTime createdAt) {
    }

    public record ThreadDto(
            String ticket,
            String name,
            String email,
            String status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<MessageDto> messages
    ) {
    }

    public record SubmitResponse(boolean success, String message, String ticket, String accessToken) {
    }
}

