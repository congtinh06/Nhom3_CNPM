package com.echora.content.controller;

import com.echora.content.dto.ProductPriceQueryDto;
import com.echora.content.dto.ProductPriceResponseDto;
import com.echora.content.service.ProductService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content/internal/products")
@RequiredArgsConstructor
@Hidden
public class ProductInternalController {

    private final ProductService productService;

    @PostMapping("/prices")
    public ResponseEntity<List<ProductPriceResponseDto>> getProductPricesByPost(
            @Valid @RequestBody ProductPriceQueryDto query) {
        return ResponseEntity.ok(productService.getProductPrices(query.getProductIds()));
    }

    @GetMapping("/prices")
    public ResponseEntity<List<ProductPriceResponseDto>> getProductPricesByGet(
            @RequestParam List<Long> ids) {
        return ResponseEntity.ok(productService.getProductPrices(ids));
    }
}
