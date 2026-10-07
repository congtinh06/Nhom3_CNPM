package com.saigonvoice.content.repository;

import com.saigonvoice.content.entity.ProductTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductTranslationRepository extends JpaRepository<ProductTranslation, Long> {

    List<ProductTranslation> findByProductId(Long productId);

    Optional<ProductTranslation> findByProductIdAndLang(Long productId, String lang);
}
