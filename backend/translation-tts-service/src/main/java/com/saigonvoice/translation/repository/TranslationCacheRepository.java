package com.saigonvoice.translation.repository;

import com.saigonvoice.translation.entity.TranslationCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TranslationCacheRepository extends JpaRepository<TranslationCache, Long> {
    Optional<TranslationCache> findByContentHash(String contentHash);
}
