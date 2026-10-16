package com.saigonvoice.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.content.config.AdminRoleFilter;
import com.saigonvoice.content.dto.AdminPoiDetailDto;
import com.saigonvoice.content.dto.AdminPoiListItemDto;
import com.saigonvoice.content.dto.AdminPoiTranslationDto;
import com.saigonvoice.content.dto.UpdatePoiRequest;
import com.saigonvoice.content.exception.ConflictException;
import com.saigonvoice.content.exception.GlobalExceptionHandler;
import com.saigonvoice.content.service.PoiContentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PoiAdminControllerTest {

    private static final String VALID_KEY = "test-internal-secret-key-123";

    @Mock
    private PoiContentService poiContentService;

    @InjectMocks
    private PoiController poiController;

    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AdminRoleFilter filter = new AdminRoleFilter();
        ReflectionTestUtils.setField(filter, "expectedApiKey", VALID_KEY);

        adminMockMvc = MockMvcBuilders.standaloneSetup(poiController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .addFilters(filter)
                .build();
    }

    private AdminPoiListItemDto sampleItem() {
        return AdminPoiListItemDto.builder()
                .id(100L).code("POI_TEST_01").name("Bưu điện Trung tâm")
                .zoneId(1L).zoneCode("D1_HISTORIC")
                .stopOrder(2).status("ACTIVE").version(0L).publishStatus("PUBLISHED")
                .audioStatusByLanguage(Map.of("vi", "READY", "en", "PENDING"))
                .build();
    }

    private AdminPoiDetailDto sampleDetail(long version) {
        return AdminPoiDetailDto.builder()
                .id(100L).code("POI_TEST_01").name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .zoneId(1L).zoneCode("D1_HISTORIC")
                .categoryId(1L).categoryCode("ARCHITECTURE").categoryNameVi("Kiến trúc")
                .status("ACTIVE").version(version).publishStatus("PUBLISHED").publishAttempts(0)
                .translations(Map.of("vi", AdminPoiTranslationDto.builder()
                        .languageCode("vi").title("Bưu điện Trung tâm").audioStatus("READY").build()))
                .build();
    }

    private UpdatePoiRequest sampleUpdateRequest(long version) {
        return UpdatePoiRequest.builder()
                .version(version)
                .categoryId(1L)
                .name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000"))
                .longitude(new BigDecimal("106.7001000"))
                .title("Bưu điện Trung tâm")
                .summary("Tóm tắt")
                .description("Mô tả chi tiết")
                .build();
    }

    @Test
    @DisplayName("GET /api/content/admin/pois: role ADMIN -> 200 kèm trang + audioStatus theo ngôn ngữ")
    void testAdminList_Returns200() throws Exception {
        when(poiContentService.getAdminPois(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleItem()), PageRequest.of(0, 20), 1));

        adminMockMvc.perform(get("/api/content/admin/pois")
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(100))
                .andExpect(jsonPath("$.content[0].zoneCode").value("D1_HISTORIC"))
                .andExpect(jsonPath("$.content[0].version").value(0))
                .andExpect(jsonPath("$.content[0].audioStatusByLanguage.vi").value("READY"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/content/admin/pois: thiếu X-User-Role -> 403 (AdminRoleFilter)")
    void testAdminList_MissingRole_Returns403() throws Exception {
        adminMockMvc.perform(get("/api/content/admin/pois"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thực hiện thao tác này."));
    }

    @Test
    @DisplayName("GET /api/content/admin/pois/{id}: role ADMIN -> 200 kèm toàn bộ bản dịch")
    void testAdminDetail_Returns200() throws Exception {
        when(poiContentService.getAdminPoiDetail(100L)).thenReturn(sampleDetail(2L));

        adminMockMvc.perform(get("/api/content/admin/pois/{id}", 100L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.categoryId").value(1))
                .andExpect(jsonPath("$.translations.vi.title").value("Bưu điện Trung tâm"));
    }

    @Test
    @DisplayName("PUT /api/content/admin/pois/{id}: role ADMIN + version khớp -> 200 kèm version mới")
    void testAdminUpdate_Returns200WithNewVersion() throws Exception {
        when(poiContentService.updatePoi(eq(100L), any(UpdatePoiRequest.class))).thenReturn(sampleDetail(4L));

        adminMockMvc.perform(put("/api/content/admin/pois/{id}", 100L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleUpdateRequest(3L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(4));
    }

    @Test
    @DisplayName("PUT /api/content/admin/pois/{id}: version lệch -> 409 kèm thông báo tiếng Việt")
    void testAdminUpdate_StaleVersion_Returns409() throws Exception {
        when(poiContentService.updatePoi(eq(100L), any(UpdatePoiRequest.class)))
                .thenThrow(new ConflictException("Nội dung đã được người khác cập nhật. Vui lòng tải lại trang."));

        adminMockMvc.perform(put("/api/content/admin/pois/{id}", 100L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleUpdateRequest(0L))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("Nội dung đã được người khác cập nhật. Vui lòng tải lại trang."));
    }
}
