package com.echora.content.service;

import com.echora.content.dto.*;
import com.echora.content.model.ProductCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductService {

    Page<ProductDto> getActiveProducts(ProductCategory category, String search, Pageable pageable);

    Page<ProductDto> getActiveProducts(ProductFilterRequest request);

    ProductDto getActiveProductBySlug(String slug);

    Page<ProductDto> getAdminProducts(ProductCategory category, String search, Boolean isActive, Pageable pageable);

    ProductDto getProductById(Long id);

    ProductDto createProduct(CreateProductRequest request);

    ProductDto updateProduct(Long id, UpdateProductRequest request);

    ProductDto updateProductStatus(Long id, UpdateProductStatusRequest request);

    ProductDto updateProductSortOrder(Long id, UpdateProductSortOrderRequest request);

    ProductDto uploadProductImage(Long id, MultipartFile file);

    List<ProductPriceResponseDto> getProductPrices(List<Long> productIds);
}
