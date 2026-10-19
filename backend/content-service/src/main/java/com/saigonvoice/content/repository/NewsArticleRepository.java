package com.saigonvoice.content.repository;

import com.saigonvoice.content.entity.NewsArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {

    @Query("SELECT n FROM NewsArticle n WHERE n.isActive = true " +
           "AND (:category IS NULL OR n.category = :category) " +
           "AND (:search IS NULL OR LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.summary) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<NewsArticle> findActiveNews(
            @Param("category") String category,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT n FROM NewsArticle n WHERE " +
           "(:category IS NULL OR n.category = :category) " +
           "AND (:search IS NULL OR LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(n.summary) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:isActive IS NULL OR n.isActive = :isActive)")
    Page<NewsArticle> findAdminNews(
            @Param("category") String category,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    Optional<NewsArticle> findBySlugAndIsActiveTrue(String slug);

    Optional<NewsArticle> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
