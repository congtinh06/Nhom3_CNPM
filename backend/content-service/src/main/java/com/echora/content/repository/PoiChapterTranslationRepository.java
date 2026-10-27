package com.echora.content.repository;

import com.echora.content.entity.PoiChapterTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PoiChapterTranslationRepository extends JpaRepository<PoiChapterTranslation, Long> {
    Optional<PoiChapterTranslation> findByChapterIdAndLanguageCode(Long chapterId, String languageCode);
    List<PoiChapterTranslation> findByChapterIdOrderByIdAsc(Long chapterId);

    // Nạp bản dịch chap của nhiều POI trong 1 query (tránh N+1 khi dựng danh sách guide).
    List<PoiChapterTranslation> findByChapterIdIn(Collection<Long> chapterIds);
}
