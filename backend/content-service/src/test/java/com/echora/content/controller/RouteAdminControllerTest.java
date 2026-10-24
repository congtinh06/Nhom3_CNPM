package com.echora.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.echora.content.config.AdminRoleFilter;
import com.echora.content.dto.AdminRouteDetailDto;
import com.echora.content.dto.AdminRouteListItemDto;
import com.echora.content.dto.PoiSummaryDto;
import com.echora.content.dto.UpdateRouteRequest;
import com.echora.content.dto.UpdateRouteStopsRequest;
import com.echora.content.dto.UpdateStatusRequest;
import com.echora.content.exception.GlobalExceptionHandler;
import com.echora.content.service.RouteService;
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
class RouteAdminControllerTest {

    private static final String VALID_KEY = "test-internal-secret-key-123";

    @Mock
    private RouteService routeService;

    @InjectMocks
    private RouteController routeController;

    private MockMvc adminMockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AdminRoleFilter filter = new AdminRoleFilter();
        ReflectionTestUtils.setField(filter, "expectedApiKey", VALID_KEY);

        adminMockMvc = MockMvcBuilders.standaloneSetup(routeController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .addFilters(filter)
                .build();
    }

    private PoiSummaryDto sampleStop(long id, int order) {
        return PoiSummaryDto.builder()
                .id(id).code("POI_" + id).name("Điểm " + id)
                .zoneId(1L).zoneCode("D1_HISTORIC").stopOrder(order)
                .build();
    }

    private AdminRouteListItemDto sampleItem() {
        return AdminRouteListItemDto.builder()
                .id(7L).zoneId(1L).zoneCode("D1_HISTORIC").zoneName("Trung tâm Lịch sử Quận 1")
                .name("Tuyến trung tâm").displayOrder(1).status("ACTIVE").stopCount(2)
                .build();
    }

    private AdminRouteDetailDto sampleDetail() {
        return AdminRouteDetailDto.builder()
                .id(7L).zoneId(1L).zoneCode("D1_HISTORIC").zoneName("Trung tâm Lịch sử Quận 1")
                .name("Tuyến trung tâm").description("Mô tả").displayOrder(1).status("ACTIVE")
                .stopCount(2).stops(List.of(sampleStop(100L, 1), sampleStop(101L, 2)))
                .build();
    }

    @Test
    @DisplayName("GET /api/content/admin/routes: role ADMIN -> 200 kèm stopCount và tên khu vực")
    void testAdminList_Returns200() throws Exception {
        when(routeService.getAdminRoutes(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleItem()), PageRequest.of(0, 20), 1));

        adminMockMvc.perform(get("/api/content/admin/routes")
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Tuyến trung tâm"))
                .andExpect(jsonPath("$.content[0].stopCount").value(2))
                .andExpect(jsonPath("$.content[0].zoneName").value("Trung tâm Lịch sử Quận 1"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/content/admin/routes: thiếu X-User-Role -> 403 (AdminRoleFilter)")
    void testAdminList_MissingRole_Returns403() throws Exception {
        adminMockMvc.perform(get("/api/content/admin/routes"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thực hiện thao tác này."));
    }

    @Test
    @DisplayName("GET /api/content/admin/routes/{id}: role ADMIN -> 200 kèm danh sách điểm dừng")
    void testAdminDetail_Returns200() throws Exception {
        when(routeService.getAdminRouteDetail(7L)).thenReturn(sampleDetail());

        adminMockMvc.perform(get("/api/content/admin/routes/{id}", 7L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.stopCount").value(2))
                .andExpect(jsonPath("$.stops[0].id").value(100))
                .andExpect(jsonPath("$.stops[1].stopOrder").value(2));
    }

    @Test
    @DisplayName("PUT /api/content/admin/routes/{id}: role ADMIN -> 200")
    void testAdminUpdate_Returns200() throws Exception {
        when(routeService.updateRoute(eq(7L), any(UpdateRouteRequest.class))).thenReturn(sampleDetail());

        UpdateRouteRequest request = UpdateRouteRequest.builder()
                .name("Tuyến trung tâm").description("Mô tả").displayOrder(1).status("ACTIVE").build();

        adminMockMvc.perform(put("/api/content/admin/routes/{id}", 7L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    @DisplayName("PUT /api/content/admin/routes/{id}/stops: role ADMIN -> 200 kèm thứ tự mới")
    void testAdminUpdateStops_Returns200() throws Exception {
        AdminRouteDetailDto result = AdminRouteDetailDto.builder()
                .id(7L).zoneId(1L).zoneCode("D1_HISTORIC").name("Tuyến trung tâm")
                .status("ACTIVE").stops(List.of(sampleStop(101L, 1), sampleStop(100L, 2)))
                .build();
        when(routeService.updateStops(eq(7L), any(UpdateRouteStopsRequest.class))).thenReturn(result);

        UpdateRouteStopsRequest request = UpdateRouteStopsRequest.builder()
                .poiIds(List.of(101L, 100L)).build();

        adminMockMvc.perform(put("/api/content/admin/routes/{id}/stops", 7L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stops[0].id").value(101))
                .andExpect(jsonPath("$.stops[1].id").value(100));
    }

    @Test
    @DisplayName("PATCH /api/content/admin/routes/{id}/status: role ADMIN -> 200 kèm status INACTIVE")
    void testAdminUpdateStatus_Returns200() throws Exception {
        AdminRouteDetailDto inactive = AdminRouteDetailDto.builder()
                .id(7L).zoneId(1L).zoneCode("D1_HISTORIC").zoneName("Trung tâm Lịch sử Quận 1")
                .name("Tuyến trung tâm").displayOrder(1).status("INACTIVE").stopCount(0)
                .stops(List.of())
                .build();
        when(routeService.updateStatus(7L, false)).thenReturn(inactive);

        UpdateStatusRequest request = UpdateStatusRequest.builder().isActive(false).build();

        adminMockMvc.perform(patch("/api/content/admin/routes/{id}/status", 7L)
                        .header(AdminRoleFilter.HEADER_ROLE, "ADMIN")
                        .header(AdminRoleFilter.HEADER_INTERNAL_API_KEY, VALID_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    @DisplayName("PATCH /api/content/admin/routes/{id}/status: thiếu X-User-Role -> 403 (AdminRoleFilter)")
    void testAdminUpdateStatus_MissingRole_Returns403() throws Exception {
        UpdateStatusRequest request = UpdateStatusRequest.builder().isActive(false).build();

        adminMockMvc.perform(patch("/api/content/admin/routes/{id}/status", 7L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
