package com.echora.content.repository;

import com.echora.content.entity.FeedbackMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackMessageRepository extends JpaRepository<FeedbackMessage, Long> {
    List<FeedbackMessage> findByThreadIdOrderByCreatedAtAsc(Long threadId);
}
