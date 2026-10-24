package com.echora.content.controller;

import com.echora.content.config.AdminRoleFilter;
import com.echora.content.config.InternalApiKeyFilter;
import com.echora.content.dto.ProductDto;
import com.echora.content.entity.ProductCategory;
import com.echora.content.exception.GlobalExceptionHandler;
import com.echora.content.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductImageServingIntegrationTest {

    private static final String VALID_INTERNAL_KEY = "test-internal-api-key";

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductAdminController productAdminController;

    @InjectMocks
    private ProductImageServingController imageServingController;

    @TempDir
    Path tempUploadDir;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(imageServingController, "uploadDir", tempUploadDir.toString());

        AdminRoleFilter adminFilter = new AdminRoleFilter();
        ReflectionTestUtils.setField(adminFilter, "expectedApiKey", VALID_INTERNAL_KEY);

        mockMvc = MockMvcBuilders.standaloneSetup(productAdminController, imageServingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(adminFilter)
                .build();
    }

    @Test
    @DisplayName("E2E Serving: Upload PNG qua controller -> GET imagePath (có/không ?v=) -> 200, Content-Type, identical bytes, nosniff, cache headers")
    void uploadPng_ThenGetProductImage_ReturnsIdenticalBytesAndProperHeaders() throws Exception {
        // Chuẩn bị byte PNG thật (magic bytes chuẩn)
        byte[] originalPngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 73, 72, 68, 82, 10, 20, 30, 40};
        MockMultipartFile file = new MockMultipartFile("file", "banh-mi.png", "image/png", originalPngBytes);

        // Giả lập lưu file vào thư mục upload phục vụ
        Path savedFile = tempUploadDir.resolve("banh-mi-thit-nguoi.png");
        Files.write(savedFile, originalPngBytes);

        ProductDto uploadResultDto = ProductDto.builder()
                .id(2L)
                .slug("banh-mi-thit-nguoi")
                .name("Bánh mì thịt nguội")
                .category(ProductCategory.FOOD)
                .price(new BigDecimal("35000"))
                .imagePath("/img/products/banh-mi-thit-nguoi.png?v=1792034589000")
                .isActive(true)
                .build();

        when(productService.uploadProductImage(eq(2L), any())).thenReturn(uploadResultDto);

        // 1. Upload qua Admin Controller
        mockMvc.perform(multipart("/api/admin/products/2/image")
                        .file(file)
                        .header("X-User-Role", "ADMIN")
                        .header("X-Internal-Api-Key", VALID_INTERNAL_KEY))
                .andExpect(status().isOk());

        // 2. GET URL với query cache-busting ?v=
        MvcResult resultWithV = mockMvc.perform(get("/img/products/banh-mi-thit-nguoi.png?v=1792034589000"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_PNG_VALUE))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cache-Control", "max-age=31536000, public, immutable"))
                .andReturn();

        byte[] returnedBytesWithV = resultWithV.getResponse().getContentAsByteArray();
        assertThat(returnedBytesWithV).isEqualTo(originalPngBytes);

        // 3. GET URL không có query ?v=
        MvcResult resultWithoutV = mockMvc.perform(get("/img/products/banh-mi-thit-nguoi.png"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_PNG_VALUE))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cache-Control", "max-age=300, must-revalidate, public"))
                .andReturn();

        byte[] returnedBytesWithoutV = resultWithoutV.getResponse().getContentAsByteArray();
        assertThat(returnedBytesWithoutV).isEqualTo(originalPngBytes);

        // 4. HEAD request
        mockMvc.perform(head("/img/products/banh-mi-thit-nguoi.png?v=1792034589000"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_PNG_VALUE))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("Serving Safety: Missing file -> trả về 404 Not Found")
    void serveProductImage_MissingFile_Returns404() throws Exception {
        mockMvc.perform(get("/img/products/khong-ton-tai.png"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Serving Safety: Tệp không phải ảnh trong thư mục upload -> từ chối 404")
    void serveProductImage_NonImageFileInDirectory_Returns404() throws Exception {
        Path textFile = tempUploadDir.resolve("secret.txt");
        Files.write(textFile, "bi mat".getBytes());

        mockMvc.perform(get("/img/products/secret.txt"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Serving Safety: Yêu cầu đường dẫn thư mục -> 404 Not Found")
    void serveProductImage_DirectoryPath_Returns404() throws Exception {
        mockMvc.perform(get("/img/products/"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Serving Safety: POST, PUT, DELETE trên đường dẫn phục vụ ảnh -> 405 Method Not Allowed")
    void serveProductImage_DisallowedHttpMethods_Returns405() throws Exception {
        Path imageFile = tempUploadDir.resolve("com-tam.png");
        Files.write(imageFile, new byte[]{1, 2, 3});

        mockMvc.perform(post("/img/products/com-tam.png"))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(put("/img/products/com-tam.png"))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(delete("/img/products/com-tam.png"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Serving Safety: Path traversal attempts (..) -> không cho phép duyệt ra ngoài")
    void serveProductImage_PathTraversal_Rejected() throws Exception {
        mockMvc.perform(get("/img/products/../com-tam.png"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/img/products/..../secret.png"))
                .andExpect(status().isNotFound());
    }
}
