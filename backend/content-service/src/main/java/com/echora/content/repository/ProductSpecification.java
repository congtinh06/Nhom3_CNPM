package com.echora.content.repository;

import com.echora.content.dto.ProductFilterRequest;
import com.echora.content.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> filter(ProductFilterRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ lấy sản phẩm đang hoạt động
            predicates.add(cb.isTrue(root.get("isActive")));

            // 2. Danh sách công khai chỉ hiển thị sản phẩm đã gắn một điểm du lịch.
            //    Sản phẩm chưa gắn điểm (poi_id NULL) vẫn còn trong DB và danh sách admin.
            predicates.add(cb.isNotNull(root.get("poi")));

            // 3. Lọc theo slug điểm du lịch khi được yêu cầu
            if (request.getPoiSlug() != null && !request.getPoiSlug().isBlank()) {
                predicates.add(cb.equal(root.get("poi").get("slug"), request.getPoiSlug().trim()));
            }

            // 4. Lọc theo từ khóa tìm kiếm (name hoặc shortDescription)
            if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
                String searchPattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("shortDescription")), searchPattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            // 5. Lọc theo danh mục enum
            if (request.getCategory() != null) {
                predicates.add(cb.equal(root.get("category"), request.getCategory()));
            }

            // 6. Lọc theo khoảng giá
            if (request.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), request.getMinPrice()));
            }
            if (request.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), request.getMaxPrice()));
            }

            // 7. Lọc theo rating tối thiểu
            if (request.getRating() != null && request.getRating() > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), BigDecimal.valueOf(request.getRating())));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> filter(ProductFilterRequest request, List<Long> targetCategoryIds) {
        return filter(request);
    }
}
