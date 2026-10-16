package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.AdminZoneDetailDto;
import com.saigonvoice.content.dto.AdminZoneListItemDto;
import com.saigonvoice.content.dto.CreateZoneRequest;
import com.saigonvoice.content.dto.UpdateZoneRequest;
import com.saigonvoice.content.dto.ZoneDto;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ConflictException;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.RouteRepository;
import com.saigonvoice.content.repository.ZoneRepository;
import com.saigonvoice.content.util.GeoUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ZoneServiceImplTest {

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private PoiRepository poiRepository;

    @Mock
    private RouteRepository routeRepository;

    @InjectMocks
    private ZoneServiceImpl zoneService;

    private Zone zoneD1;
    private Zone zoneChoLon;
    private Zone zoneVinhKhanh;
    private Zone zoneBaSon;

    @BeforeEach
    void setUp() {
        zoneD1 = Zone.builder()
                .id(1L)
                .code("D1_HISTORIC")
                .name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600)
                .isActive(true)
                .build();

        zoneChoLon = Zone.builder()
                .id(2L)
                .code("CHO_LON")
                .name("Khu Di sản Chợ Lớn")
                .centerLat(new BigDecimal("10.7533000"))
                .centerLng(new BigDecimal("106.6575000"))
                .radiusMeters(700)
                .isActive(true)
                .build();

        zoneVinhKhanh = Zone.builder()
                .id(3L)
                .code("VINH_KHANH")
                .name("Phố Ẩm thực Vĩnh Khánh")
                .centerLat(new BigDecimal("10.7600000"))
                .centerLng(new BigDecimal("106.7025000"))
                .radiusMeters(400)
                .isActive(true)
                .build();

        zoneBaSon = Zone.builder()
                .id(4L)
                .code("BA_SON")
                .name("Khu Đô thị Ven sông & Cảng Ba Son")
                .centerLat(new BigDecimal("10.7835000"))
                .centerLng(new BigDecimal("106.7085000"))
                .radiusMeters(450)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Kiểm tra 4 zone mẫu đã seed: không có bất kỳ cặp zone nào có khoảng cách tâm < tổng bán kính")
    void testSeededZonesDoNotOverlap() {
        List<Zone> seeded = List.of(zoneD1, zoneChoLon, zoneVinhKhanh, zoneBaSon);

        for (int i = 0; i < seeded.size(); i++) {
            for (int j = i + 1; j < seeded.size(); j++) {
                Zone z1 = seeded.get(i);
                Zone z2 = seeded.get(j);

                double distance = GeoUtils.haversineMeters(z1.getCenterLat(), z1.getCenterLng(), z2.getCenterLat(), z2.getCenterLng());
                double sumRadii = z1.getRadiusMeters() + z2.getRadiusMeters();

                assertThat(distance)
                        .as("Khoảng cách giữa %s và %s phải lớn hơn hoặc bằng tổng bán kính (%.1fm >= %.1fm)",
                                z1.getCode(), z2.getCode(), distance, sumRadii)
                        .isGreaterThanOrEqualTo(sumRadii);
            }
        }
    }

    @Test
    @DisplayName("Tạo zone mới bị trùng tâm hoặc chồng lấn lên zone hiện có -> ném BadRequestException")
    void createZoneOverlappingExistingThrowsException() {
        when(zoneRepository.existsByCode("NEAR_D1")).thenReturn(false);
        when(zoneRepository.findByIsActiveTrue()).thenReturn(List.of(zoneD1, zoneChoLon, zoneVinhKhanh, zoneBaSon));

        // Zone mới đặt tại 10.7780, 106.7015 (cách tâm Quận 1 chỉ ~140m), bán kính 500m
        // Khoảng cách 140m < 600m + 500m = 1100m -> Chồng lấn nghiêm trọng!
        CreateZoneRequest request = CreateZoneRequest.builder()
                .code("NEAR_D1")
                .name("Khu vực Phố đi bộ")
                .description("Mô tả thử nghiệm")
                .centerLat(new BigDecimal("10.7780000"))
                .centerLng(new BigDecimal("106.7015000"))
                .radiusMeters(500)
                .build();

        assertThatThrownBy(() -> zoneService.createZone(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chồng lấn")
                .hasMessageContaining("D1_HISTORIC");

        verify(zoneRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo zone mới ở khu vực độc lập không chồng lấn -> lưu thành công")
    void createZoneNonOverlappingSucceeds() {
        when(zoneRepository.existsByCode("THU_DUC_CENTER")).thenReturn(false);
        when(zoneRepository.findByIsActiveTrue()).thenReturn(List.of(zoneD1, zoneChoLon, zoneVinhKhanh, zoneBaSon));
        when(zoneRepository.save(any(Zone.class))).thenAnswer(invocation -> {
            Zone z = invocation.getArgument(0);
            z.setId(10L);
            return z;
        });

        // Khu vực Thành phố Thủ Đức: 10.8490, 106.7710 (cách Quận 1 hơn 11km)
        CreateZoneRequest request = CreateZoneRequest.builder()
                .code("THU_DUC_CENTER")
                .name("Trung tâm Thành phố Thủ Đức")
                .description("Khu vực mới")
                .centerLat(new BigDecimal("10.8490000"))
                .centerLng(new BigDecimal("106.7710000"))
                .radiusMeters(1000)
                .build();

        ZoneDto result = zoneService.createZone(request);

        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("THU_DUC_CENTER");
        verify(zoneRepository).save(any(Zone.class));
    }

    @Test
    @DisplayName("Tạo zone mới trùng mã code -> ném BadRequestException")
    void createZoneDuplicateCodeThrowsException() {
        when(zoneRepository.existsByCode("D1_HISTORIC")).thenReturn(true);

        CreateZoneRequest request = CreateZoneRequest.builder()
                .code("D1_HISTORIC")
                .name("Trùng mã")
                .centerLat(new BigDecimal("10.9000000"))
                .centerLng(new BigDecimal("106.9000000"))
                .radiusMeters(500)
                .build();

        assertThatThrownBy(() -> zoneService.createZone(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Zone code already exists");

        verify(zoneRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sửa zone khiến nó chồng lấn sang zone khác -> ném BadRequestException")
    void updateZoneOverlappingAnotherThrowsException() {
        when(zoneRepository.findById(4L)).thenReturn(java.util.Optional.of(zoneBaSon));
        when(zoneRepository.findByIsActiveTrue()).thenReturn(List.of(zoneD1, zoneChoLon, zoneVinhKhanh, zoneBaSon));

        // Sửa zoneBaSon (id=4) dời tâm sang 10.7770, 106.7010 (ngay sát Quận 1), bán kính 500m
        com.saigonvoice.content.dto.UpdateZoneRequest request = com.saigonvoice.content.dto.UpdateZoneRequest.builder()
                .name("Ba Son Mới")
                .description("Cập nhật dời vị trí")
                .centerLat(new BigDecimal("10.7770000"))
                .centerLng(new BigDecimal("106.7010000"))
                .radiusMeters(500)
                .isActive(true)
                .version(0L)
                .build();

        assertThatThrownBy(() -> zoneService.updateZone(4L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chồng lấn")
                .hasMessageContaining("D1_HISTORIC");
    }

    @Test
    @DisplayName("Sửa zone thông thường không gây chồng lấn -> lưu thành công (không tự so sánh với chính nó)")
    void updateZoneWithoutOverlapSucceeds() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(zoneRepository.findByIsActiveTrue()).thenReturn(List.of(zoneD1, zoneChoLon, zoneVinhKhanh, zoneBaSon));
        when(zoneRepository.save(any(Zone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Sửa zoneD1 (id=1): giữ nguyên tọa độ, chỉ đổi tên và mô tả
        com.saigonvoice.content.dto.UpdateZoneRequest request = com.saigonvoice.content.dto.UpdateZoneRequest.builder()
                .name("Trung tâm Lịch sử Quận 1 (Cập nhật)")
                .description("Mô tả mới")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600)
                .isActive(true)
                .version(0L)
                .build();

        ZoneDto updated = zoneService.updateZone(1L, request);
        assertThat(updated).isNotNull();
        assertThat(updated.getName()).isEqualTo("Trung tâm Lịch sử Quận 1 (Cập nhật)");
        verify(zoneRepository).save(zoneD1);
    }

    @Test
    @DisplayName("Sửa bán kính zone 1 một chút thì không báo chồng lấn với chính nó")
    void updateZoneChangeRadiusSlightlyDoesNotSelfOverlap() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(zoneRepository.findByIsActiveTrue()).thenReturn(List.of(zoneD1, zoneChoLon, zoneVinhKhanh, zoneBaSon));
        when(zoneRepository.save(any(Zone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Sửa bán kính zone 1 (D1_HISTORIC) từ 600m lên 650m
        com.saigonvoice.content.dto.UpdateZoneRequest request = com.saigonvoice.content.dto.UpdateZoneRequest.builder()
                .name("Trung tâm Lịch sử")
                .description("Mô tả mới")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(650)
                .isActive(true)
                .version(0L)
                .build();

        ZoneDto updated = zoneService.updateZone(1L, request);

        assertThat(updated).isNotNull();
        assertThat(updated.getRadiusMeters()).isEqualTo(650);
        verify(zoneRepository).save(zoneD1);
    }

    @Test
    @DisplayName("Cập nhật khu vực với version cũ -> ném ConflictException (HTTP 409)")
    void updateZoneStaleVersionThrowsConflict() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));

        UpdateZoneRequest request = UpdateZoneRequest.builder()
                .name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600)
                .isActive(true)
                .version(99L)
                .build();

        assertThatThrownBy(() -> zoneService.updateZone(1L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Nội dung đã được người khác cập nhật");

        verify(zoneRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật khu vực thành công thì tăng version lên 1")
    void updateZoneIncrementsVersion() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(zoneRepository.findByIsActiveTrue()).thenReturn(List.of(zoneD1));
        when(zoneRepository.save(any(Zone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateZoneRequest request = UpdateZoneRequest.builder()
                .name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600)
                .isActive(true)
                .version(0L)
                .build();

        zoneService.updateZone(1L, request);

        assertThat(zoneD1.getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Ngừng hoạt động khu vực khi vẫn còn điểm thuyết minh -> ném BadRequestException tiếng Việt")
    void deactivateZoneWithPoisThrowsException() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(poiRepository.countByZoneId(1L)).thenReturn(3L);

        UpdateZoneRequest request = UpdateZoneRequest.builder()
                .name("Trung tâm Lịch sử Quận 1")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600)
                .isActive(false)
                .version(0L)
                .build();

        assertThatThrownBy(() -> zoneService.updateZone(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể ngừng hoạt động khu vực");

        verify(zoneRepository, never()).save(any());
    }

    @Test
    @DisplayName("Endpoint trạng thái: ngừng hoạt động khu vực còn điểm -> BadRequestException")
    void updateStatusDeactivateWithPoisThrows() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(poiRepository.countByZoneId(1L)).thenReturn(4L);

        assertThatThrownBy(() -> zoneService.updateStatus(1L, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể ngừng hoạt động khu vực");

        verify(zoneRepository, never()).save(any());
    }

    @Test
    @DisplayName("Endpoint trạng thái: ngừng hoạt động khu vực rỗng -> thành công")
    void updateStatusDeactivateEmptyZoneSucceeds() {
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(poiRepository.countByZoneId(1L)).thenReturn(0L);
        when(zoneRepository.save(any(Zone.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(routeRepository.countByZoneId(1L)).thenReturn(0L);

        AdminZoneDetailDto detail = zoneService.updateStatus(1L, false);

        assertThat(detail.getIsActive()).isFalse();
        verify(zoneRepository).save(zoneD1);
    }

    @Test
    @DisplayName("Endpoint trạng thái: bật hoạt động khu vực -> thành công")
    void updateStatusActivateSucceeds() {
        zoneD1.setIsActive(false);
        when(zoneRepository.findById(1L)).thenReturn(java.util.Optional.of(zoneD1));
        when(zoneRepository.save(any(Zone.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(poiRepository.countByZoneId(1L)).thenReturn(2L);
        when(routeRepository.countByZoneId(1L)).thenReturn(1L);

        AdminZoneDetailDto detail = zoneService.updateStatus(1L, true);

        assertThat(detail.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("Endpoint trạng thái: khu vực không tồn tại -> ResourceNotFoundException")
    void updateStatusNotFoundThrows() {
        when(zoneRepository.findById(99L)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> zoneService.updateStatus(99L, true))
                .isInstanceOf(com.saigonvoice.content.exception.ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Danh sách khu vực admin: gắn poiCount theo lô, không truy vấn từng dòng")
    void getAdminZonesMapsPoiCounts() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Zone> page = new PageImpl<>(List.of(zoneD1, zoneChoLon), pageable, 2);
        when(zoneRepository.searchAdminZones(null, null, pageable)).thenReturn(page);
        java.util.List<Object[]> counts = new java.util.ArrayList<>();
        counts.add(new Object[]{1L, 5L});
        when(poiRepository.countPoisByZoneIds(List.of(1L, 2L))).thenReturn(counts);

        Page<AdminZoneListItemDto> result = zoneService.getAdminZones(null, null, pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getPoiCount()).isEqualTo(5L);
        assertThat(result.getContent().get(1).getPoiCount()).isEqualTo(0L);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("D1_HISTORIC");
        verify(poiRepository, times(1)).countPoisByZoneIds(List.of(1L, 2L));
    }
}
