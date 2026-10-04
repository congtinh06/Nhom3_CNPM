package com.saigonvoice.translation.repository;

import com.saigonvoice.translation.entity.TtsAudioCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TtsAudioCacheRepository extends JpaRepository<TtsAudioCache, Long> {
    Optional<TtsAudioCache> findByContentHash(String contentHash);
}
