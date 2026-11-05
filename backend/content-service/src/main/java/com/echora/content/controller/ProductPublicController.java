package com.echora.content.controller;

import com.echora.content.dto.ProductDto;
import com.echora.content.model.ProductCategory;
import com.echora.content.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.echora.content.dto.ProductFilterRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping({"/api/v1/products", "/api/content/products"})
@RequiredArgsConstructor
public class ProductPublicController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductDto>> getProducts(
            @Valid @ModelAttribute ProductFilterRequest request,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name) {
        if (request.getKeyword() == null || request.getKeyword().isBlank()) {
            String legacyKeyword = (search != null && !search.isBlank()) ? search : name;
            if (legacyKeyword != null && !legacyKeyword.isBlank()) {
                request.setKeyword(legacyKeyword);
            }
        }
        if (request.getCategory() == null && category != null) {
            request.setCategory(category);
        }
        return ResponseEntity.ok(productService.getActiveProducts(request));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProductDto> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getActiveProductBySlug(slug));
    }
}
