package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.*;
import com.saigonvoice.content.entity.Product;
import com.saigonvoice.content.entity.ProductCategory;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.ProductRepository;
import com.saigonvoice.content.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.saigonvoice.content.entity.Category;
import com.saigonvoice.content.repository.CategoryRepository;
import com.saigonvoice.content.repository.ProductSpecification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Value("${app.product.upload-dir:uploads/products}")
    private String uploadDir;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> getActiveProducts(ProductFilterRequest request) {
        List<Long> targetCategoryIds = null;
        if (request.getCategoryId() != null) {
            targetCategoryIds = new ArrayList<>();
            targetCategoryIds.add(request.getCategoryId());
            List<Category> subCategories = categoryRepository.findByParentId(request.getCategoryId());
            if (subCategories != null && !subCategories.isEmpty()) {
                for (Category sub : subCategories) {
                    targetCategoryIds.add(sub.getId());
                }
            }
        }

        Sort sort = switch (request.getSortBy() != null ? request.getSortBy() : "popular") {
            case "price-asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price-desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "rating-desc" -> Sort.by(Sort.Direction.DESC, "rating");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "reviewsCount").and(Sort.by(Sort.Direction.ASC, "sortOrder"));
        };

        int pageNumber = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        int pageSize = request.getSize() != null && request.getSize() > 0 ? request.getSize() : 12;
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Specification<Product> spec = ProductSpecification.filter(request, targetCategoryIds);
        return productRepository.findAll(spec, pageable).map(ProductDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> getActiveProducts(ProductCategory category, String search, Pageable pageable) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return productRepository.findActiveProducts(category, trimmedSearch, pageable)
                .map(ProductDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDto getActiveProductBySlug(String slug) {
        return productRepository.findBySlugAndIsActiveTrue(slug)
                .map(ProductDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: " + slug));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> getAdminProducts(ProductCategory category, String search, Boolean isActive, Pageable pageable) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        return productRepository.findAdminProducts(category, trimmedSearch, isActive, pageable)
                .map(ProductDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        return productRepository.findById(id)
                .map(ProductDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));
    }

    @Override
    @Transactional
    public ProductDto createProduct(CreateProductRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtils.toSlug(request.getSlug())
                : SlugUtils.toSlug(request.getName());

        if (slug.isBlank()) {
            throw new BadRequestException("Slug không hợp lệ và không thể tự sinh từ tên sản phẩm");
        }

        if (productRepository.existsBySlug(slug)) {
            throw new BadRequestException("Slug đã tồn tại: " + slug);
        }

        String imagePath = (request.getImagePath() != null && !request.getImagePath().isBlank())
                ? request.getImagePath()
                : "/img/products/" + slug + ".jpg";

        Product product = Product.builder()
                .slug(slug)
                .name(request.getName().trim())
                .category(request.getCategory())
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .price(request.getPrice())
                .imagePath(imagePath)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        Product saved = productRepository.save(product);
        log.info("Created product id={} slug={}", saved.getId(), saved.getSlug());
        return ProductDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductDto updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));

        String targetSlug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtils.toSlug(request.getSlug())
                : product.getSlug();

        if (productRepository.existsBySlugAndIdNot(targetSlug, id)) {
            throw new BadRequestException("Slug đã thuộc về sản phẩm khác: " + targetSlug);
        }

        product.setSlug(targetSlug);
        product.setName(request.getName().trim());
        product.setCategory(request.getCategory());
        product.setShortDescription(request.getShortDescription());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        if (request.getImagePath() != null && !request.getImagePath().isBlank()) {
            product.setImagePath(request.getImagePath());
        }
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }

        Product updated = productRepository.save(product);
        log.info("Updated product id={} slug={}", updated.getId(), updated.getSlug());
        return ProductDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public ProductDto updateProductStatus(Long id, UpdateProductStatusRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));

        product.setIsActive(request.getIsActive());
        Product updated = productRepository.save(product);
        log.info("Updated product status id={} isActive={}", updated.getId(), updated.getIsActive());
        return ProductDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public ProductDto updateProductSortOrder(Long id, UpdateProductSortOrderRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));

        product.setSortOrder(request.getSortOrder());
        Product updated = productRepository.save(product);
        log.info("Updated product sort order id={} sortOrder={}", updated.getId(), updated.getSortOrder());
        return ProductDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public ProductDto uploadProductImage(Long id, MultipartFile file) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được rỗng");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
            throw new BadRequestException("Định dạng ảnh không hỗ trợ, vui lòng dùng jpg, jpeg, png, webp");
        }

        try {
            Path targetDirectory = Paths.get(uploadDir);
            if (!Files.exists(targetDirectory)) {
                Files.createDirectories(targetDirectory);
            }

            String filename = product.getSlug() + extension;
            Path destination = targetDirectory.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String imagePath = "/img/products/" + product.getSlug() + ".jpg";
            product.setImagePath(imagePath);
            Product updated = productRepository.save(product);
            log.info("Uploaded product image for id={}, path={}", updated.getId(), imagePath);
            return ProductDto.fromEntity(updated);
        } catch (IOException e) {
            log.error("Failed to store uploaded file for product id={}", id, e);
            throw new BadRequestException("Không thể lưu trữ tệp ảnh tải lên: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductPriceResponseDto> getProductPrices(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> products = productRepository.findByIdIn(productIds);
        return products.stream()
                .map(p -> ProductPriceResponseDto.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .price(p.getPrice())
                        .isActive(p.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }
}
