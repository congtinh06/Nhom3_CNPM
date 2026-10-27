package com.echora.content.repository;

import com.echora.content.entity.PoiChapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoiChapterRepository extends JpaRepository<PoiChapter, Long> {
    List<PoiChapter> findByPoiIdOrderByChapterOrderAsc(Long poiId);
    List<PoiChapter> findByPoiIdAndIsActiveTrueOrderByChapterOrderAsc(Long poiId);

    List<PoiChapter> findByPoiIdInAndIsActiveTrueOrderByPoiIdAscChapterOrderAsc(List<Long> poiIds);

    Optional<PoiChapter> findByPoiIdAndChapterOrder(Long poiId, Integer chapterOrder);

    int countByPoiId(Long poiId);
}
