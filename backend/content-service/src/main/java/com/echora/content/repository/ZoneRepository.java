package com.echora.content.repository;

import com.echora.content.entity.Zone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {
    List<Zone> findByIsActiveTrue();
    Optional<Zone> findByCode(String code);
    boolean existsByCode(String code);

    // Danh sách khu vực cho admin: lọc theo trạng thái + tìm theo tên/mã, phân trang phía server.
    @Query("SELECT z FROM Zone z " +
           "WHERE (:active IS NULL OR z.isActive = :active) " +
           "AND (:searchPattern IS NULL OR z.name LIKE :searchPattern OR z.code LIKE :searchPattern)")
    Page<Zone> searchAdminZones(
            @Param("active") Boolean active,
            @Param("searchPattern") String searchPattern,
            Pageable pageable);
}
