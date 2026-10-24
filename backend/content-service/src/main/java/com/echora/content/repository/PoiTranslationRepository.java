package com.echora.content.repository;

import com.echora.content.entity.PoiTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PoiTranslationRepository extends JpaRepository<PoiTranslation, Long> {
    Optional<PoiTranslation> findByPoiIdAndLanguageCode(Long poiId, String languageCode);
    List<PoiTranslation> findByPoiId(Long poiId);

    // Nạp bản dịch của nhiều POI trong 1 query (tránh N+1 khi dựng danh sách admin).
    List<PoiTranslation> findByPoiIdIn(Collection<Long> poiIds);
}
