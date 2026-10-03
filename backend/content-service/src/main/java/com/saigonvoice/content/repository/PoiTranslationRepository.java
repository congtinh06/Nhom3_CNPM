package com.saigonvoice.content.repository;

import com.saigonvoice.content.entity.PoiTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoiTranslationRepository extends JpaRepository<PoiTranslation, Long> {
    Optional<PoiTranslation> findByPoiIdAndLanguageCode(Long poiId, String languageCode);
    List<PoiTranslation> findByPoiId(Long poiId);
}
