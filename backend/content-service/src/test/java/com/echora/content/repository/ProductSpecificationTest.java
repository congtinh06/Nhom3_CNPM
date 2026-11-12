package com.echora.content.repository;

import com.echora.content.dto.ProductFilterRequest;
import com.echora.content.entity.Product;
import com.echora.content.model.ProductCategory;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class ProductSpecificationTest {

    @Mock
    private Root<Product> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Mock
    private Path<Object> isActivePath;

    @Mock
    private Path<Object> poiPath;

    @Mock
    private Path<Object> poiSlugPath;

    private Predicate predicate;

    @BeforeEach
    void setUp() {
        predicate = mock(Predicate.class);
        when(root.get("isActive")).thenReturn((Path) isActivePath);
        when(root.get("poi")).thenReturn((Path) poiPath);
        when(cb.isTrue(any())).thenReturn(predicate);
        when(cb.isNotNull(any())).thenReturn(predicate);
        when(cb.and(any(Predicate[].class))).thenReturn(predicate);
    }

    @Test
    @DisplayName("filter: luôn loại sản phẩm chưa gắn điểm du lịch (poi IS NOT NULL)")
    void filter_AlwaysExcludesUnlinkedProducts() {
        Specification<Product> spec = ProductSpecification.filter(new ProductFilterRequest());

        spec.toPredicate(root, query, cb);

        verify(cb).isNotNull(poiPath);
        verify(cb, never()).equal(eq(poiSlugPath), any());
    }

    @Test
    @DisplayName("filter: có poiSlug -> thêm điều kiện khớp slug điểm du lịch")
    void filter_WithPoiSlug_AddsEqualityPredicate() {
        when(poiPath.get("slug")).thenReturn((Path) poiSlugPath);
        when(cb.equal(any(Expression.class), any(Object.class))).thenReturn(predicate);

        ProductFilterRequest request = ProductFilterRequest.builder()
                .poiSlug("chua-ba-thien-hau")
                .build();

        Specification<Product> spec = ProductSpecification.filter(request);
        spec.toPredicate(root, query, cb);

        verify(cb).isNotNull(poiPath);
        verify(cb).equal(poiSlugPath, "chua-ba-thien-hau");
    }

    @Test
    @DisplayName("filter: có category enum -> thêm điều kiện lọc theo ProductCategory")
    void filter_WithCategory_AddsCategoryEqualityPredicate() {
        Path<Object> categoryPath = mock(Path.class);
        when(root.get("category")).thenReturn((Path) categoryPath);
        when(cb.equal(any(Expression.class), any(Object.class))).thenReturn(predicate);

        ProductFilterRequest request = ProductFilterRequest.builder()
                .category(ProductCategory.SOUVENIR)
                .build();

        Specification<Product> spec = ProductSpecification.filter(request);
        spec.toPredicate(root, query, cb);

        verify(cb).equal(categoryPath, ProductCategory.SOUVENIR);
    }

    @Test
    @DisplayName("filter: có keyword -> tạo LIKE trực tiếp không bọc LOWER (dựa collation CI)")
    void filter_WithKeyword_AddsLikeWithoutLower() {
        Path<String> namePath = mock(Path.class);
        Path<String> shortDescPath = mock(Path.class);
        when(root.get("name")).thenReturn((Path) namePath);
        when(root.get("shortDescription")).thenReturn((Path) shortDescPath);
        when(cb.like(any(Expression.class), any(String.class))).thenReturn(predicate);
        when(cb.or(any(Predicate.class), any(Predicate.class))).thenReturn(predicate);

        ProductFilterRequest request = ProductFilterRequest.builder()
                .keyword("  Bánh Tráng  ")
                .build();

        Specification<Product> spec = ProductSpecification.filter(request);
        spec.toPredicate(root, query, cb);

        verify(cb, never()).lower(any());
        verify(cb).like(namePath, "%bánh tráng%");
        verify(cb).like(shortDescPath, "%bánh tráng%");
    }
}
