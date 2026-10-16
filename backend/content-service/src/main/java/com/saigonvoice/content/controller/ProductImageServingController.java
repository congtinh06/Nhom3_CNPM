package com.saigonvoice.content.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * Controller phục vụ ảnh sản phẩm tải lên một cách an toàn và tối ưu cache.
 * Đường dẫn: GET /img/products/{filename}
 * Chỉ hỗ trợ GET và HEAD, từ chối mọi phương thức khác (POST, PUT, DELETE trả 405).
 * Kiểm tra chặt chẽ tên tệp, chống path traversal, không duyệt thư mục.
 */
@RestController
@RequestMapping("/img/products")
@Slf4j
public class ProductImageServingController {

    private static final Pattern SAFE_FILENAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+\\.(jpg|jpeg|png|webp)$");

    @Value("${app.product.upload-dir:uploads/products}")
    private String uploadDir;

    @RequestMapping(value = "/{filename:.+}", method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<Resource> serveProductImage(
            @PathVariable("filename") String filename,
            @RequestParam(value = "v", required = false) String version) {

        if (filename == null || !SAFE_FILENAME_PATTERN.matcher(filename).matches()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path filePath = baseDir.resolve(filename).normalize().toAbsolutePath();

        // Chống path traversal: tệp phải nằm hoàn toàn trong thư mục baseDir
        if (!filePath.startsWith(baseDir)) {
            log.warn("Phát hiện nguy cơ path traversal khi truy cập ảnh sản phẩm: {}", filename);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // Tệp không tồn tại hoặc là thư mục -> 404
        if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        MediaType mediaType = determineMediaType(filename);
        if (mediaType == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (MalformedURLException e) {
            log.error("Lỗi khi tạo resource cho tệp {}: {}", filePath, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        CacheControl cacheControl;
        if (version != null && !version.isBlank()) {
            // Có query cache-busting ?v= -> cache lâu dài an toàn
            cacheControl = CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable();
        } else {
            // Không có ?v= -> cache ngắn và bắt buộc revalidate
            cacheControl = CacheControl.maxAge(300, TimeUnit.SECONDS).cachePublic().mustRevalidate();
        }

        long contentLength;
        try {
            contentLength = Files.size(filePath);
        } catch (IOException e) {
            contentLength = -1;
        }

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(mediaType)
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(cacheControl);

        if (contentLength >= 0) {
            builder.contentLength(contentLength);
        }

        return builder.body(resource);
    }

    private MediaType determineMediaType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        } else if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return null;
    }
}
