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
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

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

    @TempDir
    Path tempDir;

    private Product activeFood;
    private Product inactiveFood;
    private Product activeDrink;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(productService, "uploadDir", tempDir.toString());
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

    // --- S2.1 Image Upload & Slug Tests ---

    @Test
    @DisplayName("uploadProductImage: sản phẩm không tồn tại -> 404 ResourceNotFoundException")
    void uploadProductImage_NotFound() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0});

        assertThatThrownBy(() -> productService.uploadProductImage(999L, file))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm");
    }

    @Test
    @DisplayName("uploadProductImage: tệp rỗng -> 400 BadRequestException")
    void uploadProductImage_EmptyFile() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> productService.uploadProductImage(1L, emptyFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("File ảnh không được rỗng");
    }

    @Test
    @DisplayName("uploadProductImage: tệp vượt quá 2MB -> 400 BadRequestException")
    void uploadProductImage_Oversize() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        byte[] largeBytes = new byte[2 * 1024 * 1024 + 1];
        MockMultipartFile largeFile = new MockMultipartFile("file", "large.jpg", "image/jpeg", largeBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(1L, largeFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá giới hạn tối đa 2MB");
    }

    @Test
    @DisplayName("uploadProductImage: tên tệp chứa ký tự path traversal -> 400 BadRequestException")
    void uploadProductImage_PathTraversalFileName() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F', 0, 1};
        MockMultipartFile traversalFile = new MockMultipartFile("file", "../evil.jpg", "image/jpeg", jpegBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(1L, traversalFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không an toàn");
    }

    @Test
    @DisplayName("uploadProductImage: định dạng contentType không hỗ trợ -> 400 BadRequestException")
    void uploadProductImage_UnsupportedContentType() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        MockMultipartFile textFile = new MockMultipartFile("file", "script.sh", "application/x-sh", "echo hi".getBytes());

        assertThatThrownBy(() -> productService.uploadProductImage(1L, textFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Định dạng ảnh không hỗ trợ");
    }

    @Test
    @DisplayName("uploadProductImage: đuôi .jpg nhưng nội dung không đúng magic bytes JPEG -> 400")
    void uploadProductImage_InvalidMagicBytes() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        byte[] fakeBytes = "Hello this is a plain text file pretending to be jpg".getBytes();
        MockMultipartFile fakeFile = new MockMultipartFile("file", "fake.jpg", "image/jpeg", fakeBytes);

        assertThatThrownBy(() -> productService.uploadProductImage(1L, fakeFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("magic bytes không khớp");
    }

    @Test
    @DisplayName("uploadProductImage: PNG hợp lệ -> lưu trữ với đuôi .png và đường dẫn cache buster ?v=")
    void uploadProductImage_ValidPng_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 1, 2, 3};
        MockMultipartFile pngFile = new MockMultipartFile("file", "photo.png", "image/png", pngBytes);

        ProductDto result = productService.uploadProductImage(1L, pngFile);

        assertThat(result.getImagePath()).startsWith("/img/products/com-tam-suon-bi-cha.png?v=");
        Path savedFile = tempDir.resolve("com-tam-suon-bi-cha.png");
        assertThat(Files.exists(savedFile)).isTrue();
    }

    @Test
    @DisplayName("uploadProductImage: tệp PNG 1.5MB hợp lệ -> lưu thành công và trả về đường dẫn .png chuẩn")
    void uploadProductImage_1Point5MegabytePng_Success() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        // 1.5MB = 1,572,864 bytes
        byte[] largePngBytes = new byte[1572864];
        // PNG magic bytes
        largePngBytes[0] = (byte) 0x89;
        largePngBytes[1] = 0x50;
        largePngBytes[2] = 0x4E;
        largePngBytes[3] = 0x47;
        largePngBytes[4] = 0x0D;
        largePngBytes[5] = 0x0A;
        largePngBytes[6] = 0x1A;
        largePngBytes[7] = 0x0A;

        MockMultipartFile largePngFile = new MockMultipartFile("file", "mon-an-1.5mb.png", "image/png", largePngBytes);

        ProductDto result = productService.uploadProductImage(1L, largePngFile);

        assertThat(result.getImagePath()).startsWith("/img/products/com-tam-suon-bi-cha.png?v=");
        Path savedFile = tempDir.resolve("com-tam-suon-bi-cha.png");
        assertThat(Files.exists(savedFile)).isTrue();
        assertThat(Files.size(savedFile)).isEqualTo(1572864L);
    }

    @Test
    @DisplayName("uploadProductImage: WebP hợp lệ -> lưu trữ với đuôi .webp và đường dẫn cache buster ?v=")
    void uploadProductImage_ValidWebp_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        byte[] webpBytes = new byte[]{'R', 'I', 'F', 'F', 36, 0, 0, 0, 'W', 'E', 'B', 'P', 1, 2, 3};
        MockMultipartFile webpFile = new MockMultipartFile("file", "photo.webp", "image/webp", webpBytes);

        ProductDto result = productService.uploadProductImage(1L, webpFile);

        assertThat(result.getImagePath()).startsWith("/img/products/com-tam-suon-bi-cha.webp?v=");
        Path savedFile = tempDir.resolve("com-tam-suon-bi-cha.webp");
        assertThat(Files.exists(savedFile)).isTrue();
    }

    @Test
    @DisplayName("uploadProductImage: upload lại với extension khác -> xóa file cũ để tránh orphan")
    void uploadProductImage_Reupload_CleansUpOldFile() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        // Create an existing .jpg file on disk
        Path existingJpg = tempDir.resolve("com-tam-suon-bi-cha.jpg");
        Files.write(existingJpg, new byte[]{1, 2, 3});
        assertThat(Files.exists(existingJpg)).isTrue();

        // Upload a new PNG
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        MockMultipartFile pngFile = new MockMultipartFile("file", "new.png", "image/png", pngBytes);

        productService.uploadProductImage(1L, pngFile);

        // Old JPG should be deleted and new PNG should exist
        assertThat(Files.exists(existingJpg)).isFalse();
        assertThat(Files.exists(tempDir.resolve("com-tam-suon-bi-cha.png"))).isTrue();
    }

    @Test
    @DisplayName("updateProduct: đổi slug -> đổi tên file ảnh trên disk và cập nhật imagePath")
    void updateProduct_SlugChange_RenamesImageFile() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));
        when(productRepository.existsBySlugAndIdNot("com-tam-dac-biet", 1L)).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        // Create old file on disk
        Path oldJpg = tempDir.resolve("com-tam-suon-bi-cha.jpg");
        Files.write(oldJpg, new byte[]{1, 2, 3});

        UpdateProductRequest req = UpdateProductRequest.builder()
                .name("Cơm tấm đặc biệt")
                .slug("com-tam-dac-biet")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("60000"))
                .build();

        ProductDto updated = productService.updateProduct(1L, req);

        assertThat(updated.getSlug()).isEqualTo("com-tam-dac-biet");
        assertThat(Files.exists(oldJpg)).isFalse();
        assertThat(Files.exists(tempDir.resolve("com-tam-dac-biet.jpg"))).isTrue();
        assertThat(updated.getImagePath()).startsWith("/img/products/com-tam-dac-biet.jpg");
    }

    @Test
    @DisplayName("createProduct: slug không đúng định dạng regex -> 400 BadRequestException")
    void createProduct_InvalidSlug_ThrowsBadRequestException() {
        CreateProductRequest req = CreateProductRequest.builder()
                .name("Sản phẩm lỗi slug")
                .slug("Invalid--Slug-")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("10000"))
                .build();

        assertThatThrownBy(() -> productService.createProduct(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Slug chỉ được chứa chữ thường không dấu");
    }

    @Test
    @DisplayName("updateProduct: slug không đúng định dạng regex -> 400 BadRequestException")
    void updateProduct_InvalidSlug_ThrowsBadRequestException() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(activeFood));

        UpdateProductRequest req = UpdateProductRequest.builder()
                .name("Sản phẩm lỗi slug")
                .slug("UPPERCASE-SLUG")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("10000"))
                .build();

        assertThatThrownBy(() -> productService.updateProduct(1L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Slug chỉ được chứa chữ thường không dấu");
    }
}
