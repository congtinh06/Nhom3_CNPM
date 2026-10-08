package com.saigonvoice.content.repository;

import com.saigonvoice.content.dto.ProductFilterRequest;
import com.saigonvoice.content.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> filter(ProductFilterRequest request, List<Long> targetCategoryIds) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ lấy sản phẩm đang hoạt động
            predicates.add(cb.isTrue(root.get("isActive")));

            // 2. Lọc theo từ khóa tìm kiếm (name hoặc shortDescription)
            if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
                String searchPattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("shortDescription")), searchPattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            // 3. Lọc theo danh mục (category entity theo ID bao gồm cả cây con nếu có)
            if (targetCategoryIds != null && !targetCategoryIds.isEmpty()) {
                predicates.add(root.get("categoryEntity").get("id").in(targetCategoryIds));
            } else if (request.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("categoryEntity").get("id"), request.getCategoryId()));
            } else if (request.getCategory() != null) {
                predicates.add(cb.equal(root.get("category"), request.getCategory()));
            }

            // 4. Lọc theo khoảng giá
            if (request.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), request.getMinPrice()));
            }
            if (request.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), request.getMaxPrice()));
            }

            // 5. Lọc theo rating tối thiểu
            if (request.getRating() != null && request.getRating() > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), BigDecimal.valueOf(request.getRating())));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
