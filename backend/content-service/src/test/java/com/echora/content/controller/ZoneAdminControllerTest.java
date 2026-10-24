package com.echora.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.echora.content.config.AdminRoleFilter;
import com.echora.content.dto.AdminZoneDetailDto;
import com.echora.content.dto.AdminZoneListItemDto;
import com.echora.content.dto.UpdateStatusRequest;
import com.echora.content.dto.UpdateZoneRequest;
import com.echora.content.exception.BadRequestException;
import com.echora.content.exception.GlobalExceptionHandler;
import com.echora.content.service.ZoneService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ZoneAdminControllerTest {

    private static final String VALID_KEY = "test-internal-secret-key-123";

    @Mock
    private ZoneService zoneService;

    @InjectMocks
    private ZoneController zoneController;

    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AdminRoleFilter filter = new AdminRoleFilter();
        ReflectionTestUtils.setField(filter, "expectedApiKey", VALID_KEY);

        adminMockMvc = MockMvcBuilders.standaloneSetup(zoneController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .addFilters(filter)
                .build();
    }

    private AdminZoneListItemDto sampleItem() {
        return AdminZoneListItemDto.builder()
                .id(1L).code("D1_HISTORIC").name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000")).centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600).isActive(true).poiCount(12)
                .build();
    }

    private AdminZoneDetailDto sampleDetail() {
        return AdminZoneDetailDto.builder()
                .id(1L).code("D1_HISTORIC").name("Trung tâm Lịch sử Quận 1")
                .description("Khu trung tâm").centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000")).radiusMeters(600)
                .isActive(true).poiCount(12).routeCount(3)
                .build();
    }

    @Test
    @DisplayName("GET /api/content/admin/zones: role ADMIN -> 200 kèm poiCount và trạng thái")
    void testAdminList_Returns200() throws Exception {
        when(zoneService.getAdminZones(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleItem()), PageRequest.of(0, 20), 1));

        adminMockMvc.perform(get("/api/content/admin/zones")
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].code").value("D1_HISTORIC"))
                .andExpect(jsonPath("$.content[0].poiCount").value(12))
                .andExpect(jsonPath("$.content[0].isActive").value(true))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/content/admin/zones: thiếu X-User-Role -> 403 (AdminRoleFilter)")
    void testAdminList_MissingRole_Returns403() throws Exception {
        adminMockMvc.perform(get("/api/content/admin/zones"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thực hiện thao tác này."));
    }

    @Test
    @DisplayName("GET /api/content/admin/zones/{id}: role ADMIN -> 200 kèm poiCount và routeCount")
    void testAdminDetail_Returns200() throws Exception {
        when(zoneService.getAdminZoneDetail(1L)).thenReturn(sampleDetail());

        adminMockMvc.perform(get("/api/content/admin/zones/{id}", 1L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.poiCount").value(12))
                .andExpect(jsonPath("$.routeCount").value(3));
    }

    @Test
    @DisplayName("PUT /api/content/admin/zones/{id}: chặn ngừng hoạt động -> 400 kèm thông báo tiếng Việt")
    void testAdminUpdate_DeactivateWithPois_Returns400() throws Exception {
        when(zoneService.updateZone(eq(1L), any(UpdateZoneRequest.class)))
                .thenThrow(new BadRequestException("Không thể ngừng hoạt động khu vực khi vẫn còn 12 điểm thuyết minh thuộc khu vực này. Vui lòng chuyển hoặc xóa các điểm trước."));

        UpdateZoneRequest request = UpdateZoneRequest.builder()
                .name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600)
                .isActive(false)
                .build();

        adminMockMvc.perform(put("/api/content/admin/zones/{id}", 1L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Không thể ngừng hoạt động khu vực")));
    }

    @Test
    @DisplayName("PATCH /api/content/admin/zones/{id}/status: role ADMIN -> 200 kèm isActive=false")
    void testAdminUpdateStatus_Returns200() throws Exception {
        AdminZoneDetailDto inactive = AdminZoneDetailDto.builder()
                .id(1L).code("D1_HISTORIC").name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000")).centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600).isActive(false).poiCount(0).routeCount(0)
                .build();
        when(zoneService.updateStatus(1L, false)).thenReturn(inactive);

        UpdateStatusRequest request = UpdateStatusRequest.builder().isActive(false).build();

        adminMockMvc.perform(patch("/api/content/admin/zones/{id}/status", 1L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("PATCH /api/content/admin/zones/{id}/status: thiếu X-User-Role -> 403 (AdminRoleFilter)")
    void testAdminUpdateStatus_MissingRole_Returns403() throws Exception {
        UpdateStatusRequest request = UpdateStatusRequest.builder().isActive(false).build();

        adminMockMvc.perform(patch("/api/content/admin/zones/{id}/status", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
