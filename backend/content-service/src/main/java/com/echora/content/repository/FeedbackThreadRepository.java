package com.echora.content.repository;

import com.echora.content.entity.FeedbackThread;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface FeedbackThreadRepository extends JpaRepository<FeedbackThread, Long> {
    Optional<FeedbackThread> findByTicket(String ticket);
    List<FeedbackThread> findAllByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);
}
