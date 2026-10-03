package com.antiphishing.poi.repository;

import com.antiphishing.poi.entity.PoiCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PoiCacheRepository extends JpaRepository<PoiCache, Long> {
    Optional<PoiCache> findByCacheKeyAndExpiresAtAfter(String cacheKey, LocalDateTime now);
    void deleteByExpiresAtBefore(LocalDateTime now);
}
