package com.echora.content.service;

import com.echora.content.dto.FeedbackDtos.MessageDto;
import com.echora.content.dto.FeedbackDtos.ReplyRequest;
import com.echora.content.dto.FeedbackDtos.SubmitRequest;
import com.echora.content.dto.FeedbackDtos.SubmitResponse;
import com.echora.content.dto.FeedbackDtos.ThreadDto;
import com.echora.content.entity.FeedbackMessage;
import com.echora.content.entity.FeedbackThread;
import com.echora.content.repository.FeedbackMessageRepository;
import com.echora.content.repository.FeedbackThreadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Service managing customer feedback threads and admin replies.
 */
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackThreadRepository threads;
    private final FeedbackMessageRepository messages;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public SubmitResponse submit(SubmitRequest request) {
        String token = randomToken();
        LocalDateTime now = LocalDateTime.now();
        FeedbackThread thread = threads.save(FeedbackThread.builder()
                .ticket(UUID.randomUUID().toString())
                .name(request.name().trim())
                .email(request.email().trim().toLowerCase())
                .tokenHash(hash(token))
                .status("OPEN")
                .createdAt(now)
                .updatedAt(now)
                .build());
        messages.save(FeedbackMessage.builder()
                .thread(thread)
                .sender("CUSTOMER")
                .content(request.message().trim())
                .createdAt(now)
                .build());
        return new SubmitResponse(true, "Tin nhắn đã được gửi. Hãy lưu mã theo dõi để xem phản hồi.", thread.getTicket(), token);
    }

    @Transactional(readOnly = true)
    public ThreadDto customerThread(String ticket, String token) {
        FeedbackThread thread = find(ticket);
        verifyToken(thread, token);
        return toDto(thread);
    }

    @Transactional(readOnly = true)
    public List<ThreadDto> myThreads(Long userId) {
        return threads.findAllByOwnerUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ThreadDto claim(String ticket, Long userId, String token) {
        FeedbackThread thread = find(ticket);
        verifyToken(thread, token);
        if (thread.getOwnerUserId() != null && !thread.getOwnerUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        thread.setOwnerUserId(userId);
        return toDto(threads.save(thread));
    }

    @Transactional(readOnly = true)
    public List<ThreadDto> adminList() {
        return threads.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ThreadDto adminReply(String ticket, ReplyRequest request) {
        FeedbackThread thread = find(ticket);
        LocalDateTime now = LocalDateTime.now();
        messages.save(FeedbackMessage.builder()
                .thread(thread)
                .sender("ADMIN")
                .content(request.message().trim())
                .createdAt(now)
                .build());
        thread.setStatus("REPLIED");
        thread.setUpdatedAt(now);
        threads.save(thread);
        return toDto(thread);
    }

    private FeedbackThread find(String ticket) {
        return threads.findByTicket(ticket)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void verifyToken(FeedbackThread thread, String token) {
        if (token == null || !MessageDigest.isEqual(
                thread.getTokenHash().getBytes(StandardCharsets.US_ASCII),
                hash(token).getBytes(StandardCharsets.US_ASCII))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    private ThreadDto toDto(FeedbackThread thread) {
        return new ThreadDto(
                thread.getTicket(),
                thread.getName(),
                thread.getEmail(),
                thread.getStatus(),
                thread.getCreatedAt(),
                thread.getUpdatedAt(),
                messages.findByThreadIdOrderByCreatedAtAsc(thread.getId()).stream()
                        .map(m -> new MessageDto(m.getId(), m.getSender(), m.getContent(), m.getCreatedAt()))
                        .toList());
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

