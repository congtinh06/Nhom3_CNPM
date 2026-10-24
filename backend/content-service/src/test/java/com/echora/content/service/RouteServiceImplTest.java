package com.echora.content.service;

import com.echora.content.dto.AdminRouteDetailDto;
import com.echora.content.dto.AdminRouteListItemDto;
import com.echora.content.dto.UpdateRouteRequest;
import com.echora.content.dto.UpdateRouteStopsRequest;
import com.echora.content.entity.Category;
import com.echora.content.entity.Poi;
import com.echora.content.entity.Route;
import com.echora.content.entity.Zone;
import com.echora.content.exception.BadRequestException;
import com.echora.content.exception.ConflictException;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.RouteRepository;
import com.echora.content.repository.ZoneRepository;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteServiceImplTest {

    @Mock
    private RouteRepository routeRepository;
    @Mock
    private ZoneRepository zoneRepository;
    @Mock
    private PoiRepository poiRepository;
    @Mock
    private RouteStopsSynchronizer routeStopsSynchronizer;

    @InjectMocks
    private RouteServiceImpl routeService;

    private Zone zone;
    private Route route;
    private Category category;

    @BeforeEach
    void setUp() {
        zone = Zone.builder().id(1L).code("D1_HISTORIC").name("Quận 1")
                .centerLat(new BigDecimal("10.7769000")).centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600).isActive(true).build();
        route = Route.builder().id(7L).zone(zone).name("Tuyến trung tâm")
                .displayOrder(1).status("ACTIVE").build();
        category = Category.builder().id(5L).code("ARCHITECTURE").nameVi("Kiến trúc").nameEn("Architecture").build();
    }

    private Poi poi(long id, Zone z, Route r, Integer order) {
        return Poi.builder().id(id).code("POI_" + id).qrToken("qr-" + id).name("Điểm " + id)
                .zone(z).category(category).route(r).stopOrder(order)
                .latitude(new BigDecimal("10.7700000")).longitude(new BigDecimal("106.7000000"))
                .triggerRadiusMeters(50).status("ACTIVE").build();
    }

    private List<Long> ids(Long... values) {
        return new ArrayList<>(Arrays.asList(values));
    }

    @Test
    @DisplayName("Cập nhật điểm dừng hợp lệ: gán stopOrder 1..n theo đúng thứ tự gửi lên")
    void updateStopsAssignsOrder() {
        Poi p1 = poi(10L, zone, null, null);
        Poi p2 = poi(11L, zone, null, null);

        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.findAllById(List.of(11L, 10L))).thenReturn(List.of(p1, p2));
        when(routeRepository.save(any(Route.class))).thenAnswer(inv -> inv.getArgument(0));
        when(poiRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(poiRepository.findStopsOfRoute(7L)).thenReturn(List.of(p2, p1));

        routeService.updateStops(7L, UpdateRouteStopsRequest.builder().poiIds(ids(11L, 10L)).version(0L).build());

        assertThat(p2.getStopOrder()).isEqualTo(1);
        assertThat(p1.getStopOrder()).isEqualTo(2);
        verify(poiRepository).detachAllFromRoute(7L);
        verify(poiRepository).saveAll(any());
    }

    @Test
    @DisplayName("Cập nhật điểm dừng có POI không tồn tại -> ResourceNotFoundException")
    void updateStopsUnknownPoiThrows() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.findAllById(List.of(999L))).thenReturn(List.of());

        assertThatThrownBy(() -> routeService.updateStops(7L, UpdateRouteStopsRequest.builder().poiIds(ids(999L)).version(0L).build()))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(poiRepository, never()).detachAllFromRoute(anyLong());
    }

    @Test
    @DisplayName("Cập nhật điểm dừng trùng id -> BadRequestException")
    void updateStopsDuplicateThrows() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));

        assertThatThrownBy(() -> routeService.updateStops(7L, UpdateRouteStopsRequest.builder().poiIds(ids(10L, 10L)).version(0L).build()))
                .isInstanceOf(BadRequestException.class);

        verify(poiRepository, never()).findAllById(any());
    }

    @Test
    @DisplayName("Cập nhật điểm dừng di chuyển POI từ tuyến khác -> đánh số lại tuyến cũ")
    void updateStopsMovedPoiRenumbersOldRoute() {
        Route oldRoute = Route.builder().id(9L).zone(zone).name("Tuyến cũ").status("ACTIVE").build();
        Poi moved = poi(10L, zone, oldRoute, 2);
        Poi existing = poi(11L, zone, route, 1);

        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.findAllById(List.of(11L, 10L))).thenReturn(List.of(existing, moved));
        when(routeRepository.save(any(Route.class))).thenAnswer(inv -> inv.getArgument(0));
        when(poiRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(poiRepository.findStopsOfRoute(7L)).thenReturn(List.of(existing, moved));

        routeService.updateStops(7L, UpdateRouteStopsRequest.builder().poiIds(ids(11L, 10L)).version(0L).build());

        verify(routeStopsSynchronizer).renumberRoute(9L);
    }

    @Test
    @DisplayName("Ngừng hoạt động tuyến qua endpoint trạng thái khi còn điểm dừng -> BadRequestException")
    void updateStatusDeactivateWithStopsThrows() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.countByRouteId(7L)).thenReturn(2L);

        assertThatThrownBy(() -> routeService.updateStatus(7L, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể ngừng hoạt động tuyến");

        verify(routeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Bật hoạt động tuyến qua endpoint trạng thái -> đặt ACTIVE")
    void updateStatusActivateSetsActive() {
        route.setStatus("INACTIVE");
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(routeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(poiRepository.findStopsOfRoute(7L)).thenReturn(List.of());

        AdminRouteDetailDto detail = routeService.updateStatus(7L, true);

        assertThat(detail.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("Cập nhật điểm dừng có POI thuộc khu vực khác -> BadRequestException")
    void updateStopsCrossZoneThrows() {
        Zone otherZone = Zone.builder().id(2L).code("CHO_LON").name("Chợ Lớn")
                .centerLat(new BigDecimal("10.7500000")).centerLng(new BigDecimal("106.6500000"))
                .radiusMeters(700).isActive(true).build();
        Poi cross = poi(20L, otherZone, null, null);

        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.findAllById(List.of(20L))).thenReturn(List.of(cross));

        assertThatThrownBy(() -> routeService.updateStops(7L, UpdateRouteStopsRequest.builder().poiIds(ids(20L)).version(0L).build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("another zone");
    }

    @Test
    @DisplayName("Ngừng hoạt động tuyến khi vẫn còn điểm dừng -> BadRequestException tiếng Việt")
    void updateRouteDeactivateWithStopsThrows() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.countByRouteId(7L)).thenReturn(3L);

        UpdateRouteRequest request = UpdateRouteRequest.builder()
                .name("Tuyến trung tâm").displayOrder(1).status("INACTIVE").version(0L).build();

        assertThatThrownBy(() -> routeService.updateRoute(7L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể ngừng hoạt động tuyến");

        verify(routeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật tuyến với version cũ -> ConflictException (HTTP 409)")
    void updateRouteStaleVersionThrowsConflict() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));

        UpdateRouteRequest request = UpdateRouteRequest.builder()
                .name("Tuyến trung tâm").displayOrder(1).status("ACTIVE").version(99L).build();

        assertThatThrownBy(() -> routeService.updateRoute(7L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Nội dung đã được người khác cập nhật");

        verify(routeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật tuyến thành công thì tăng version lên 1")
    void updateRouteIncrementsVersion() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(routeRepository.save(any(Route.class))).thenAnswer(inv -> inv.getArgument(0));
        when(poiRepository.findStopsOfRoute(7L)).thenReturn(List.of());

        UpdateRouteRequest request = UpdateRouteRequest.builder()
                .name("Tuyến trung tâm").displayOrder(1).status("ACTIVE").version(0L).build();

        routeService.updateRoute(7L, request);

        assertThat(route.getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Cập nhật điểm dừng với version cũ -> ConflictException (HTTP 409)")
    void updateStopsStaleVersionThrowsConflict() {
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));

        assertThatThrownBy(() -> routeService.updateStops(7L, UpdateRouteStopsRequest.builder().poiIds(ids(11L, 10L)).version(99L).build()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Nội dung đã được người khác cập nhật");

        verify(poiRepository, never()).detachAllFromRoute(anyLong());
    }

    @Test
    @DisplayName("Danh sách tuyến admin: gắn stopCount theo lô (một truy vấn)")
    void getAdminRoutesMapsStopCounts() {        Route r2 = Route.builder().id(8L).zone(zone).name("Tuyến ven sông")
                .displayOrder(2).status("ACTIVE").build();
        Pageable pageable = PageRequest.of(0, 20);
        Page<Route> page = new PageImpl<>(List.of(route, r2), pageable, 2);
        when(routeRepository.searchAdminRoutes(null, null, null, pageable)).thenReturn(page);
        java.util.List<Object[]> counts = new java.util.ArrayList<>();
        counts.add(new Object[]{7L, 4L});
        when(poiRepository.countStopsByRouteIds(List.of(7L, 8L))).thenReturn(counts);

        Page<AdminRouteListItemDto> result = routeService.getAdminRoutes(null, null, null, pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getStopCount()).isEqualTo(4L);
        assertThat(result.getContent().get(1).getStopCount()).isEqualTo(0L);
        assertThat(result.getContent().get(0).getZoneName()).isEqualTo("Quận 1");
        verify(poiRepository, times(1)).countStopsByRouteIds(List.of(7L, 8L));
    }

    @Test
    @DisplayName("Chi tiết tuyến admin: trả danh sách điểm dừng kèm stopCount")
    void getAdminRouteDetailReturnsStops() {
        Poi p1 = poi(10L, zone, route, 1);
        Poi p2 = poi(11L, zone, route, 2);
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.findStopsOfRoute(7L)).thenReturn(List.of(p1, p2));

        AdminRouteDetailDto detail = routeService.getAdminRouteDetail(7L);

        assertThat(detail.getStopCount()).isEqualTo(2);
        assertThat(detail.getStops()).hasSize(2);
        assertThat(detail.getStops().get(0).getId()).isEqualTo(10L);
        assertThat(detail.getZoneName()).isEqualTo("Quận 1");
    }
}
