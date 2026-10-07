package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.ProductPriceQueryDto;
import com.saigonvoice.content.dto.ProductPriceResponseDto;
import com.saigonvoice.content.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content/internal/products")
@RequiredArgsConstructor
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
