package com.echora.content.controller;

import com.echora.content.dto.FeedbackDtos.ReplyRequest;
import com.echora.content.dto.FeedbackDtos.SubmitRequest;
import com.echora.content.dto.FeedbackDtos.SubmitResponse;
import com.echora.content.dto.FeedbackDtos.ThreadDto;
import com.echora.content.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/api/feedback")
    @ResponseStatus(HttpStatus.CREATED)
    public SubmitResponse submit(
            @Valid @RequestBody SubmitRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return feedbackService.submit(request, userId);
    }

    @GetMapping("/api/feedback/{ticket}")
    public ThreadDto customerThread(
            @PathVariable String ticket,
            @RequestHeader(value = "X-Feedback-Token", required = false) String token) {
        return feedbackService.customerThread(ticket, token);
    }

    @GetMapping("/api/feedback/me")
    public List<ThreadDto> myThreads(@RequestHeader("X-User-Id") Long userId) {
        return feedbackService.myThreads(userId);
    }

    @PostMapping("/api/feedback/{ticket}/claim")
    public ThreadDto claim(
            @PathVariable String ticket,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-Feedback-Token", required = false) String token) {
        return feedbackService.claim(ticket, userId, token);
    }

    @GetMapping("/api/admin/feedback")
    public List<ThreadDto> adminList() {
        return feedbackService.adminList();
    }

    @PostMapping("/api/admin/feedback/{ticket}/replies")
    public ThreadDto adminReply(
            @PathVariable String ticket,
            @Valid @RequestBody ReplyRequest request) {
        return feedbackService.adminReply(ticket, request);
    }
}
