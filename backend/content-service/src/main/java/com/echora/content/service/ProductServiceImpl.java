package com.echora.content.service;

import com.echora.content.dto.*;
import com.echora.content.entity.Product;
import com.echora.content.model.ProductCategory;
import com.echora.content.exception.BadRequestException;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.repository.ProductRepository;
import com.echora.content.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.echora.content.entity.Category;
import com.echora.content.entity.Poi;
import com.echora.content.repository.CategoryRepository;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.ProductSpecification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final PoiRepository poiRepository;

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
        return productRepository.findActiveProducts(category, toSearchPattern(search), pageable)
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
        return productRepository.findAdminProducts(category, toSearchPattern(search), isActive, pageable)
                .map(ProductDto::fromEntity);
    }

    private String toSearchPattern(String search) {
        return (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%"
                : null;
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
        String slug;
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            slug = request.getSlug().trim();
            if (!SLUG_PATTERN.matcher(slug).matches()) {
                throw new BadRequestException("Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang");
            }
        } else {
            slug = SlugUtils.toSlug(request.getName());
        }

        if (slug.isBlank() || !SLUG_PATTERN.matcher(slug).matches()) {
            throw new BadRequestException("Slug không hợp lệ và không thể tự sinh từ tên sản phẩm");
        }

        if (productRepository.existsBySlug(slug)) {
            throw new BadRequestException("Slug đã tồn tại: " + slug);
        }

        String imagePath = (request.getImagePath() != null && !request.getImagePath().isBlank())
                ? request.getImagePath()
                : "/img/products/" + slug + ".jpg";

        Poi poi = resolvePoi(request.getPoiId());

        Product product = Product.builder()
                .slug(slug)
                .name(request.getName().trim())
                .category(request.getCategory())
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .price(request.getPrice())
                .imagePath(imagePath)
                .poi(poi)
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

        String oldSlug = product.getSlug();
        String targetSlug;
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            targetSlug = request.getSlug().trim();
            if (!SLUG_PATTERN.matcher(targetSlug).matches()) {
                throw new BadRequestException("Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang");
            }
        } else {
            targetSlug = product.getSlug();
        }

        if (productRepository.existsBySlugAndIdNot(targetSlug, id)) {
            throw new BadRequestException("Slug đã thuộc về sản phẩm khác: " + targetSlug);
        }

        // If slug changed, migrate any existing image files on disk to prevent orphan/broken links
        Map<Path, Path> movedFiles = new LinkedHashMap<>();
        if (!targetSlug.equals(oldSlug)) {
            Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();

            // Refuse rename if target file already exists on disk
            for (String ext : List.of(".jpg", ".jpeg", ".png", ".webp")) {
                Path targetFile = baseDir.resolve(targetSlug + ext).normalize().toAbsolutePath();
                if (targetFile.startsWith(baseDir) && Files.exists(targetFile)) {
                    throw new BadRequestException("Tệp ảnh đích đã tồn tại trên đĩa cho slug mới: " + targetSlug + ext);
                }
            }

            for (String ext : List.of(".jpg", ".jpeg", ".png", ".webp")) {
                Path oldFile = baseDir.resolve(oldSlug + ext).normalize().toAbsolutePath();
                if (oldFile.startsWith(baseDir) && Files.exists(oldFile)) {
                    Path newFile = baseDir.resolve(targetSlug + ext).normalize().toAbsolutePath();
                    if (newFile.startsWith(baseDir)) {
                        try {
                            Files.move(oldFile, newFile);
                            movedFiles.put(newFile, oldFile);
                            log.info("Renamed product image file from {} to {}", oldFile, newFile);
                            if (request.getImagePath() == null || request.getImagePath().isBlank()) {
                                product.setImagePath("/img/products/" + targetSlug + ext + "?v=" + System.currentTimeMillis());
                            }
                        } catch (IOException e) {
                            log.error("Failed to rename product image from {} to {}: {}", oldFile, newFile, e.getMessage());
                            rollbackMovedFiles(movedFiles);
                            throw new BadRequestException("Không thể đổi tên tệp ảnh sản phẩm trên đĩa: " + e.getMessage());
                        }
                    }
                }
            }
            // Also update imagePath if it pointed to oldSlug and wasn't explicitly changed
            if ((request.getImagePath() == null || request.getImagePath().isBlank())
                    && product.getImagePath() != null
                    && product.getImagePath().startsWith("/img/products/" + oldSlug)) {
                String currentPath = product.getImagePath();
                String remaining = currentPath.substring(("/img/products/" + oldSlug).length());
                product.setImagePath("/img/products/" + targetSlug + remaining);
            }
        }

        product.setSlug(targetSlug);
        product.setName(request.getName().trim());
        product.setCategory(request.getCategory());
        product.setShortDescription(request.getShortDescription());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        if (request.getPoiId() != null) {
            product.setPoi(resolvePoi(request.getPoiId()));
        }
        if (request.getImagePath() != null && !request.getImagePath().isBlank()) {
            product.setImagePath(request.getImagePath());
        }
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }

        try {
            Product updated = productRepository.save(product);
            log.info("Updated product id={} slug={}", updated.getId(), updated.getSlug());
            return ProductDto.fromEntity(updated);
        } catch (Exception e) {
            log.error("Failed to save product after rename, rolling back moved image files", e);
            rollbackMovedFiles(movedFiles);
            throw e;
        }
    }

    private Poi resolvePoi(Long poiId) {
        if (poiId == null) {
            return null;
        }
        return poiRepository.findById(poiId)
                .orElseThrow(() -> new BadRequestException("Điểm du lịch không tồn tại: " + poiId));
    }

    private void rollbackMovedFiles(Map<Path, Path> movedFiles) {
        for (Map.Entry<Path, Path> entry : movedFiles.entrySet()) {
            Path newFile = entry.getKey();
            Path oldFile = entry.getValue();
            try {
                if (Files.exists(newFile)) {
                    Files.move(newFile, oldFile, StandardCopyOption.REPLACE_EXISTING);
                    log.info("Rolled back product image file from {} to {}", newFile, oldFile);
                }
            } catch (IOException rollbackEx) {
                log.error("Failed to rollback product image file from {} to {}: {}", newFile, oldFile, rollbackEx.getMessage());
            }
        }
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

        String extension = validateAndDetectImage(file);

        Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(targetDirectory)) {
            try {
                Files.createDirectories(targetDirectory);
            } catch (IOException e) {
                log.error("Failed to create upload directory {}", targetDirectory, e);
                throw new BadRequestException("Không thể tạo thư mục lưu trữ ảnh: " + e.getMessage());
            }
        }

        String filename = product.getSlug() + extension;
        Path destination = targetDirectory.resolve(filename).normalize().toAbsolutePath();
        if (!destination.startsWith(targetDirectory)) {
            throw new BadRequestException("Đường dẫn lưu tệp không an toàn");
        }

        // Backup existing file with identical name/extension if present, so we can restore on DB failure
        Path backupFile = targetDirectory.resolve(product.getSlug() + extension + ".bak").normalize().toAbsolutePath();
        boolean hasBackup = false;
        try {
            if (Files.exists(destination)) {
                Files.move(destination, backupFile, StandardCopyOption.REPLACE_EXISTING);
                hasBackup = true;
            }
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to copy uploaded file for product id={}", id, e);
            if (hasBackup && Files.exists(backupFile)) {
                try {
                    Files.move(backupFile, destination, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException restoreEx) {
                    log.error("Failed to restore backup file after copy failure", restoreEx);
                }
            }
            throw new BadRequestException("Không thể lưu trữ tệp ảnh tải lên: " + e.getMessage());
        }

        String imagePath = "/img/products/" + product.getSlug() + extension + "?v=" + System.currentTimeMillis();
        product.setImagePath(imagePath);

        Product updated;
        try {
            updated = productRepository.save(product);
            log.info("Uploaded product image for id={}, path={}", updated.getId(), imagePath);
        } catch (Exception e) {
            log.error("Failed to save product image path to database, rolling back file changes", e);
            // On DB failure, delete new file and restore previous file (keep old one)
            try {
                if (Files.exists(destination)) {
                    Files.delete(destination);
                }
                if (hasBackup && Files.exists(backupFile)) {
                    Files.move(backupFile, destination, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException rollbackEx) {
                log.error("Failed to rollback files after DB save failure", rollbackEx);
            }
            throw new BadRequestException("Không thể cập nhật thông tin ảnh sản phẩm vào cơ sở dữ liệu: " + e.getMessage());
        }

        // DB save succeeded: remove temporary backup and previous images with other extensions
        if (hasBackup && Files.exists(backupFile)) {
            try {
                Files.delete(backupFile);
            } catch (IOException e) {
                log.warn("Failed to delete temporary backup image {}: {}", backupFile, e.getMessage());
            }
        }
        for (String ext : List.of(".jpg", ".jpeg", ".png", ".webp")) {
            if (!ext.equals(extension)) {
                Path oldFile = targetDirectory.resolve(product.getSlug() + ext).normalize().toAbsolutePath();
                if (oldFile.startsWith(targetDirectory) && Files.exists(oldFile)) {
                    try {
                        Files.delete(oldFile);
                        log.info("Removed old product image file with different extension: {}", oldFile);
                    } catch (IOException e) {
                        log.warn("Failed to delete old product image {}: {}", oldFile, e.getMessage());
                    }
                }
            }
        }

        return ProductDto.fromEntity(updated);
    }

    private String validateAndDetectImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được rỗng");
        }

        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Dung lượng ảnh vượt quá giới hạn tối đa 2MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            if (originalFilename.contains("/") || originalFilename.contains("\\") || originalFilename.contains("..")) {
                throw new BadRequestException("Tên tệp không hợp lệ hoặc chứa ký tự đường dẫn không an toàn");
            }
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Định dạng ảnh không hỗ trợ, vui lòng dùng jpg, jpeg, png, webp");
        }

        byte[] header = new byte[12];
        int bytesRead;
        try (InputStream is = file.getInputStream()) {
            bytesRead = is.read(header);
        } catch (IOException e) {
            throw new BadRequestException("Không thể đọc tệp ảnh: " + e.getMessage());
        }

        if (bytesRead < 12) {
            throw new BadRequestException("Tệp ảnh không hợp lệ hoặc kích thước quá nhỏ");
        }

        // Magic bytes validation
        boolean isJpeg = (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
        boolean isPng = (header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 && (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47
                && (header[4] & 0xFF) == 0x0D && (header[5] & 0xFF) == 0x0A && (header[6] & 0xFF) == 0x1A && (header[7] & 0xFF) == 0x0A;
        boolean isWebp = (header[0] & 0xFF) == 0x52 && (header[1] & 0xFF) == 0x49 && (header[2] & 0xFF) == 0x46 && (header[3] & 0xFF) == 0x46
                && (header[8] & 0xFF) == 0x57 && (header[9] & 0xFF) == 0x45 && (header[10] & 0xFF) == 0x42 && (header[11] & 0xFF) == 0x50;

        if (isJpeg) {
            if (!contentType.equalsIgnoreCase("image/jpeg")) {
                throw new BadRequestException("Nội dung tệp không khớp với Content-Type ảnh JPEG");
            }
            return ".jpg";
        } else if (isPng) {
            if (!contentType.equalsIgnoreCase("image/png")) {
                throw new BadRequestException("Nội dung tệp không khớp với Content-Type ảnh PNG");
            }
            return ".png";
        } else if (isWebp) {
            if (!contentType.equalsIgnoreCase("image/webp")) {
                throw new BadRequestException("Nội dung tệp không khớp với Content-Type ảnh WebP");
            }
            return ".webp";
        } else {
            throw new BadRequestException("Nội dung tệp không phải là định dạng ảnh hợp lệ (magic bytes không khớp)");
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
                        .category(p.getCategory() != null ? p.getCategory().name() : null)
                        .build())
                .collect(Collectors.toList());
    }
}
