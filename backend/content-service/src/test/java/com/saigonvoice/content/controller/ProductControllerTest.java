package com.saigonvoice.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.content.config.AdminRoleFilter;
import com.saigonvoice.content.config.InternalApiKeyFilter;
import com.saigonvoice.content.dto.*;
import com.saigonvoice.content.entity.ProductCategory;
import com.saigonvoice.content.exception.GlobalExceptionHandler;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    private static final String VALID_INTERNAL_KEY = "test-internal-api-key";

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductPublicController publicController;

    @InjectMocks
    private ProductAdminController adminController;

    @InjectMocks
    private ProductInternalController internalController;

    private MockMvc publicMockMvc;
    private MockMvc adminMockMvc;
    private MockMvc internalMockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ProductDto sampleFoodDto;

    @BeforeEach
    void setUp() {
        sampleFoodDto = ProductDto.builder()
                .id(1L)
                .slug("com-tam-suon-bi-cha")
                .name("Cơm tấm sườn bì chả")
                .category(ProductCategory.FOOD)
                .shortDescription("Cơm tấm sườn nướng")
                .price(new BigDecimal("55000"))
                .imagePath("/img/products/com-tam-suon-bi-cha.jpg")
                .isActive(true)
                .sortOrder(1)
                .build();

        // 1. Public MockMvc
        publicMockMvc = MockMvcBuilders.standaloneSetup(publicController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        // 2. Admin MockMvc with AdminRoleFilter
        adminMockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .addFilters(new AdminRoleFilter())
                .build();

        // 3. Internal MockMvc with InternalApiKeyFilter
        InternalApiKeyFilter internalFilter = new InternalApiKeyFilter();
        ReflectionTestUtils.setField(internalFilter, "expectedApiKey", VALID_INTERNAL_KEY);

        internalMockMvc = MockMvcBuilders.standaloneSetup(internalController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(internalFilter)
                .build();
    }

    // --- Public API Tests ---

    @Test
    @DisplayName("GET /api/content/products: công khai, trả 200 kèm danh sách sản phẩm active")
    void testGetPublicProducts_Returns200() throws Exception {
        when(productService.getActiveProducts(argThat(f -> f.getCategory() == ProductCategory.FOOD)))
                .thenReturn(new PageImpl<>(List.of(sampleFoodDto), org.springframework.data.domain.PageRequest.of(0, 20), 1));

        publicMockMvc.perform(get("/api/content/products")
                        .param("category", "FOOD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("com-tam-suon-bi-cha"))
                .andExpect(jsonPath("$.content[0].price").value(55000));
    }

    @Test
    @DisplayName("GET /api/content/products/{slug}: trả 200 khi sản phẩm tồn tại và đang bán")
    void testGetProductBySlug_Found_Returns200() throws Exception {
        when(productService.getActiveProductBySlug("com-tam-suon-bi-cha"))
                .thenReturn(sampleFoodDto);

        publicMockMvc.perform(get("/api/content/products/com-tam-suon-bi-cha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("com-tam-suon-bi-cha"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("GET /api/content/products/{slug}: món đã ẩn hoặc không tồn tại -> trả 404")
    void testGetProductBySlug_NotFoundOrInactive_Returns404() throws Exception {
        when(productService.getActiveProductBySlug("mon-khong-ton-tai"))
                .thenThrow(new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: mon-khong-ton-tai"));

        publicMockMvc.perform(get("/api/content/products/mon-khong-ton-tai"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // --- Admin API Tests (Role Check) ---

    @Test
    @DisplayName("GET /api/admin/products: thiếu header X-User-Role -> 403 Forbidden")
    void testAdminGetProducts_MissingRole_Returns403() throws Exception {
        adminMockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("GET /api/admin/products: có header X-User-Role = USER (không phải ADMIN) -> 403 Forbidden")
    void testAdminGetProducts_UserRole_Returns403() throws Exception {
        adminMockMvc.perform(get("/api/admin/products")
                        .header("X-User-Role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("GET /api/admin/products: có header X-User-Role = ADMIN -> 200 OK")
    void testAdminGetProducts_AdminRole_Returns200() throws Exception {
        when(productService.getAdminProducts(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleFoodDto), org.springframework.data.domain.PageRequest.of(0, 20), 1));

        adminMockMvc.perform(get("/api/admin/products")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("com-tam-suon-bi-cha"));
    }

    @Test
    @DisplayName("POST /api/admin/products: tạo sản phẩm mới với role ADMIN -> 201 Created")
    void testAdminCreateProduct_AdminRole_Returns201() throws Exception {
        CreateProductRequest req = CreateProductRequest.builder()
                .name("Bánh mì pate chả thịt Sài Gòn")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("30000"))
                .build();

        when(productService.createProduct(any(CreateProductRequest.class)))
                .thenReturn(sampleFoodDto);

        adminMockMvc.perform(post("/api/admin/products")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("com-tam-suon-bi-cha"));
    }

    @Test
    @DisplayName("PATCH /api/admin/products/{id}/status: ẩn/hiện sản phẩm với role ADMIN -> 200 OK")
    void testAdminUpdateStatus_AdminRole_Returns200() throws Exception {
        UpdateProductStatusRequest req = UpdateProductStatusRequest.builder()
                .isActive(false)
                .build();

        sampleFoodDto.setIsActive(false);
        when(productService.updateProductStatus(eq(1L), any(UpdateProductStatusRequest.class)))
                .thenReturn(sampleFoodDto);

        adminMockMvc.perform(patch("/api/admin/products/1/status")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("PATCH /api/admin/products/{id}/sort-order: cập nhật thứ tự với role ADMIN -> 200 OK")
    void testAdminUpdateSortOrder_AdminRole_Returns200() throws Exception {
        UpdateProductSortOrderRequest req = UpdateProductSortOrderRequest.builder()
                .sortOrder(10)
                .build();

        sampleFoodDto.setSortOrder(10);
        when(productService.updateProductSortOrder(eq(1L), any(UpdateProductSortOrderRequest.class)))
                .thenReturn(sampleFoodDto);

        adminMockMvc.perform(patch("/api/admin/products/1/sort-order")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sortOrder").value(10));
    }

    // --- Internal API Tests (X-Internal-Api-Key) ---

    @Test
    @DisplayName("POST /api/content/internal/products/prices: thiếu X-Internal-Api-Key -> 401 Unauthorized")
    void testInternalGetPrices_MissingKey_Returns401() throws Exception {
        ProductPriceQueryDto req = ProductPriceQueryDto.builder()
                .productIds(List.of(1L, 2L))
                .build();

        internalMockMvc.perform(post("/api/content/internal/products/prices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/content/internal/products/prices: sai X-Internal-Api-Key -> 401 Unauthorized")
    void testInternalGetPrices_InvalidKey_Returns401() throws Exception {
        ProductPriceQueryDto req = ProductPriceQueryDto.builder()
                .productIds(List.of(1L, 2L))
                .build();

        internalMockMvc.perform(post("/api/content/internal/products/prices")
                        .header("X-Internal-Api-Key", "wrong-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/content/internal/products/prices: có X-Internal-Api-Key hợp lệ -> 200 OK")
    void testInternalGetPrices_ValidKey_Returns200() throws Exception {
        ProductPriceQueryDto req = ProductPriceQueryDto.builder()
                .productIds(List.of(1L))
                .build();

        ProductPriceResponseDto priceDto = ProductPriceResponseDto.builder()
                .id(1L)
                .name("Cơm tấm sườn bì chả")
                .price(new BigDecimal("55000"))
                .isActive(true)
                .build();

        when(productService.getProductPrices(List.of(1L))).thenReturn(List.of(priceDto));

        internalMockMvc.perform(post("/api/content/internal/products/prices")
                        .header("X-Internal-Api-Key", VALID_INTERNAL_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].price").value(55000))
                .andExpect(jsonPath("$[0].isActive").value(true));
    }
}
