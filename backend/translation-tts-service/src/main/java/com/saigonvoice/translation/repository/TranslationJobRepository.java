package com.saigonvoice.translation.repository;

import com.saigonvoice.translation.entity.TranslationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TranslationJobRepository extends JpaRepository<TranslationJob, Long> {
    Optional<TranslationJob> findByPoiIdAndLanguageCodeAndContentHash(Long poiId, String languageCode, String contentHash);
}
