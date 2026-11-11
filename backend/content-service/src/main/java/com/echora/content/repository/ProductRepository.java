package com.echora.content.repository;

import com.echora.content.entity.Product;
import com.echora.content.model.ProductCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Override
    @EntityGraph(attributePaths = {"poi"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"poi"})
    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:category IS NULL OR p.category = :category) " +
           "AND (:searchPattern IS NULL OR p.name LIKE :searchPattern)")
    Page<Product> findActiveProducts(
            @Param("category") ProductCategory category,
            @Param("searchPattern") String searchPattern,
            Pageable pageable);

    @EntityGraph(attributePaths = {"poi"})
    @Query("SELECT p FROM Product p WHERE " +
           "(:category IS NULL OR p.category = :category) " +
           "AND (:searchPattern IS NULL OR p.name LIKE :searchPattern) " +
           "AND (:isActive IS NULL OR p.isActive = :isActive)")
    Page<Product> findAdminProducts(
            @Param("category") ProductCategory category,
            @Param("searchPattern") String searchPattern,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    @EntityGraph(attributePaths = {"poi"})
    Optional<Product> findBySlugAndIsActiveTrue(String slug);

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    List<Product> findByIdIn(Collection<Long> ids);
}
