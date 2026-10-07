package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.*;
import com.saigonvoice.content.entity.Product;
import com.saigonvoice.content.entity.ProductCategory;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product activeFood;
    private Product inactiveFood;
    private Product activeDrink;

    @BeforeEach
    void setUp() {
        activeFood = Product.builder()
                .id(1L)
                .slug("com-tam-suon-bi-cha")
                .name("Cơm tấm sườn bì chả")
                .category(ProductCategory.FOOD)
                .shortDescription("Cơm tấm sườn nướng")
                .description("Mô tả cơm tấm sườn bì chả đầy đủ")
                .price(new BigDecimal("55000"))
                .imagePath("/img/products/com-tam-suon-bi-cha.jpg")
                .isActive(true)
                .sortOrder(1)
                .build();

        inactiveFood = Product.builder()
                .id(2L)
                .slug("mon-an-da-an")
                .name("Món ăn đã ẩn")
                .category(ProductCategory.FOOD)
                .shortDescription("Món tạm ngưng kinh doanh")
                .description("Chi tiết món tạm ngưng")
                .price(new BigDecimal("40000"))
                .imagePath("/img/products/mon-an-da-an.jpg")
                .isActive(false)
                .sortOrder(99)
                .build();

        activeDrink = Product.builder()
                .id(3L)
                .slug("ca-phe-sua-da-sai-gon")
                .name("Cà phê sữa đá Sài Gòn")
                .category(ProductCategory.DRINK)
                .shortDescription("Cà phê pha phin")
                .description("Mô tả cà phê sữa đá đầy đủ")
                .price(new BigDecimal("25000"))
                .imagePath("/img/products/ca-phe-sua-da-sai-gon.jpg")
                .isActive(true)
                .sortOrder(2)
                .build();
    }

    @Test
    @DisplayName("getActiveProducts: chỉ trả sản phẩm active, lọc category và phân trang")
    void getActiveProducts_FilterCategory_ReturnsActiveOnly() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(List.of(activeFood), pageable, 1);
        when(productRepository.findActiveProducts(eq(ProductCategory.FOOD), isNull(), eq(pageable)))
                .thenReturn(page);

        Page<ProductDto> result = productService.getActiveProducts(ProductCategory.FOOD, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSlug()).isEqualTo("com-tam-suon-bi-cha");
        assertThat(result.getContent().get(0).getIsActive()).isTrue();
        verify(productRepository).findActiveProducts(eq(ProductCategory.FOOD), isNull(), eq(pageable));
    }

    @Test
    @DisplayName("getActiveProductBySlug: trả sản phẩm active khi slug tồn tại")
    void getActiveProductBySlug_Found_ReturnsDto() {
        when(productRepository.findBySlugAndIsActiveTrue("com-tam-suon-bi-cha"))
                .thenReturn(Optional.of(activeFood));

        ProductDto dto = productService.getActiveProductBySlug("com-tam-suon-bi-cha");

        assertThat(dto).isNotNull();
        assertThat(dto.getName()).isEqualTo("Cơm tấm sườn bì chả");
        assertThat(dto.getPrice()).isEqualByComparingTo(new BigDecimal("55000"));
    }

    @Test
    @DisplayName("getActiveProductBySlug: sản phẩm đã ẩn hoặc không tồn tại -> ném ResourceNotFoundException")
    void getActiveProductBySlug_InactiveOrNotFound_ThrowsException() {
        when(productRepository.findBySlugAndIsActiveTrue("mon-an-da-an"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getActiveProductBySlug("mon-an-da-an"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh");
    }

    @Test
    @DisplayName("createProduct: tạo sản phẩm mới thành công với slug tự sinh")
    void createProduct_Success() {
        CreateProductRequest request = CreateProductRequest.builder()
                .name("Bánh mì xíu mại")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("35000"))
                .shortDescription("Bánh mì giòn kèm xíu mại sốt cà")
                .build();

        when(productRepository.existsBySlug("banh-mi-xiu-mai")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        ProductDto dto = productService.createProduct(request);

        assertThat(dto.getId()).isEqualTo(10L);
        assertThat(dto.getSlug()).isEqualTo("banh-mi-xiu-mai");
        assertThat(dto.getImagePath()).isEqualTo("/img/products/banh-mi-xiu-mai.jpg");
        assertThat(dto.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("createProduct: slug đã tồn tại -> ném BadRequestException")
    void createProduct_DuplicateSlug_ThrowsBadRequest() {
        CreateProductRequest request = CreateProductRequest.builder()
                .name("Cơm tấm sườn bì chả")
                .slug("com-tam-suon-bi-cha")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("55000"))
                .build();

        when(productRepository.existsBySlug("com-tam-suon-bi-cha")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Slug đã tồn tại");
    }

    @Test
    @DisplayName("updateProductStatus: cập nhật is_active sang false (ẩn sản phẩm)")
    void updateProductStatus_HideProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.save(any(Product.class))).thenReturn(activeFood);

        UpdateProductStatusRequest request = UpdateProductStatusRequest.builder()
                .isActive(false)
                .build();

        ProductDto updated = productService.updateProductStatus(1L, request);

        assertThat(activeFood.getIsActive()).isFalse();
        verify(productRepository).save(activeFood);
    }

    @Test
    @DisplayName("updateProductSortOrder: cập nhật thứ tự hiển thị")
    void updateProductSortOrder_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.save(any(Product.class))).thenReturn(activeFood);

        UpdateProductSortOrderRequest request = UpdateProductSortOrderRequest.builder()
                .sortOrder(5)
                .build();

        productService.updateProductSortOrder(1L, request);

        assertThat(activeFood.getSortOrder()).isEqualTo(5);
        verify(productRepository).save(activeFood);
    }

    @Test
    @DisplayName("getProductPrices: lấy danh sách giá cho order-service theo id")
    void getProductPrices_ReturnsList() {
        when(productRepository.findByIdIn(List.of(1L, 3L)))
                .thenReturn(List.of(activeFood, activeDrink));

        List<ProductPriceResponseDto> prices = productService.getProductPrices(List.of(1L, 3L));

        assertThat(prices).hasSize(2);
        assertThat(prices.get(0).getId()).isEqualTo(1L);
        assertThat(prices.get(0).getPrice()).isEqualByComparingTo(new BigDecimal("55000"));
        assertThat(prices.get(1).getId()).isEqualTo(3L);
        assertThat(prices.get(1).getPrice()).isEqualByComparingTo(new BigDecimal("25000"));
    }
}
