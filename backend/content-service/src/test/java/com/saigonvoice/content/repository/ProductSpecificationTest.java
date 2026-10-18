package com.saigonvoice.content.repository;

import com.saigonvoice.content.dto.ProductFilterRequest;
import com.saigonvoice.content.entity.Product;
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
        Specification<Product> spec = ProductSpecification.filter(new ProductFilterRequest(), null);

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

        Specification<Product> spec = ProductSpecification.filter(request, null);
        spec.toPredicate(root, query, cb);

        verify(cb).isNotNull(poiPath);
        verify(cb).equal(poiSlugPath, "chua-ba-thien-hau");
    }
}
