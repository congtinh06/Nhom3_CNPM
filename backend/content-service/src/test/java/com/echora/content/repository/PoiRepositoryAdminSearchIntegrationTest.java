package com.echora.content.repository;

import com.echora.content.dto.AdminPoiListItemDto;
import com.echora.content.repository.PoiRepository;
import com.echora.content.entity.Category;
import com.echora.content.entity.Poi;
import com.echora.content.entity.PoiTranslation;
import com.echora.content.entity.Zone;
import com.echora.content.service.PoiContentService;
import com.echora.content.util.TimeUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Chứng minh bộ lọc overallStatus/languageStatus của searchAdminPois chạy đúng trên
 * SQL Server (value query + count query) và khớp 1-1 với cách service tự phân loại
 * điểm qua resolveOverallStatus / languageSummary — hai nguồn từng lệch nhau ở vòng trước.
 */
@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "echora.publish-retry.enabled=false"
})
@Testcontainers
class PoiRepositoryAdminSearchIntegrationTest {

    private static final List<String> ALL_LANGS = List.of("vi", "en", "ja", "ko");
    private static final PageRequest ONE_PAGE = PageRequest.of(0, 50);

    @Container
    static final MSSQLServerContainer<?> MSSQL =
            new MSSQLServerContainer<>(DockerImageName.parse("mcr.microsoft.com/mssql/server:2022-latest"))
                    .acceptLicense()
                    .withInitScript("init-test-db.sql");

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> MSSQL.getJdbcUrl() + ";databaseName=echora_content_test");
        registry.add("spring.datasource.username", MSSQL::getUsername);
        registry.add("spring.datasource.password", MSSQL::getPassword);
    }

    @Autowired private ZoneRepository zoneRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private PoiRepository poiRepository;
    @Autowired private PoiTranslationRepository translationRepository;
    @Autowired private PoiContentService poiContentService;

    // Dữ liệu seed tĩnh: mỗi test method là một instance mới nên id phải dùng chung static.
    private static final Map<String, Long> POI_IDS = new HashMap<>();
    private static final AtomicBoolean SEEDED = new AtomicBoolean(false);
    private static Category category;
    // Flyway có seed dữ liệu demo sẵn trong bảng poi → mọi kỳ vọng group theo zone của test.
    private static Long zone1Id;
    private static Long zone2Id;

    private Long id(String code) {
        return POI_IDS.get(code);
    }

    // @BeforeEach (không phải @BeforeAll) để container chạy xong trước khi Spring context
    // nạp; PER_CLASS sẽ khiến SpringExtension.prepareTestInstance chạy trước Testcontainers.
    @BeforeEach
    void seedOnce() {
        if (!SEEDED.compareAndSet(false, true)) {
            return;
        }
        zone1Id = zoneRepository.save(Zone.builder()
                .code("ZONE1").name("Quận 1")
                .centerLat(new BigDecimal("10.7700000")).centerLng(new BigDecimal("106.7000000"))
                .build()).getId();
        zone2Id = zoneRepository.save(Zone.builder()
                .code("ZONE2").name("Quận 3")
                .centerLat(new BigDecimal("10.7800000")).centerLng(new BigDecimal("106.6900000"))
                .build()).getId();
        category = categoryRepository.save(Category.builder()
                .code("CAT_IT").nameVi("Kiến trúc").nameEn("Architecture")
                .build());

        LocalDateTime old = TimeUtils.nowUtc().minusDays(1);
        Zone zone1 = zoneRepository.findById(zone1Id).orElseThrow();
        Zone zone2 = zoneRepository.findById(zone2Id).orElseThrow();

        // A: đủ 4 ngôn ngữ READY, phát hành OK -> ACTIVE
        Poi a = poi(zone1, "POI_A", "ACTIVE", "PUBLISHED");
        readyAll(a, old);

        // B: audio OK nhưng phát hành lỗi -> NEEDS_ATTENTION
        Poi b = poi(zone1, "POI_B", "ACTIVE", "FAILED");
        readyAll(b, old);

        // C: đã ẩn -> HIDDEN (dù audio lỗi cũng không rơi vào NEEDS_ATTENTION)
        Poi c = poi(zone1, "POI_C", "INACTIVE", "PUBLISHED");
        readyAll(c, old);

        // D: chưa có bản dịch nào -> NEEDS_ATTENTION (thiếu bản dịch vi) + PENDING
        poi(zone1, "POI_D", "ACTIVE", "PUBLISHED");

        // E: có ngôn ngữ lỗi TTS -> NEEDS_ATTENTION + ERROR
        Poi e = poi(zone1, "POI_E", "ACTIVE", "PUBLISHED");
        lang(e, "vi", "READY", old);
        lang(e, "en", "FAILED_TTS", TimeUtils.nowUtc());
        lang(e, "ja", "READY", old);
        lang(e, "ko", "READY", old);

        // F: PENDING quá 30 phút -> NEEDS_ATTENTION + PENDING
        Poi f = poi(zone1, "POI_F", "ACTIVE", "PUBLISHED");
        lang(f, "vi", "PENDING", TimeUtils.nowUtc().minusMinutes(60));
        lang(f, "en", "READY", old);
        lang(f, "ja", "READY", old);
        lang(f, "ko", "READY", old);

        // G: PENDING còn mới (< 30 phút) -> ACTIVE + PENDING
        Poi g = poi(zone1, "POI_G", "ACTIVE", "PUBLISHED");
        lang(g, "vi", "PENDING", TimeUtils.nowUtc().minusMinutes(1));
        lang(g, "en", "READY", old);
        lang(g, "ja", "READY", old);
        lang(g, "ko", "READY", old);

        // H: chỉ có bản dịch vi -> ACTIVE (thiếu en/ja/ko không phải lý do cần chú ý) + PENDING
        Poi h = poi(zone1, "POI_H", "ACTIVE", "PUBLISHED");
        lang(h, "vi", "READY", old);

        // I: khu vực khác, sạch sẽ -> ACTIVE
        Poi i = poi(zone2, "POI_I", "ACTIVE", "PUBLISHED");
        readyAll(i, old);

        assertThat(POI_IDS).hasSize(9);
    }

    private Poi poi(Zone zone, String code, String status, String publishStatus) {
        Poi poi = poiRepository.save(Poi.builder()
                .zone(zone)
                .category(category)
                .code(code)
                .qrToken("QR_" + code)
                .name("Điểm " + code)
                .latitude(new BigDecimal("10.7700000"))
                .longitude(new BigDecimal("106.7000000"))
                .triggerRadiusMeters(50)
                .status(status)
                .publishStatus(publishStatus)
                .build());
        POI_IDS.put(code, poi.getId());
        return poi;
    }

    private void readyAll(Poi poi, LocalDateTime attemptAt) {
        for (String langCode : ALL_LANGS) {
            lang(poi, langCode, "READY", attemptAt);
        }
    }

    private void lang(Poi poi, String languageCode, String audioStatus, LocalDateTime attemptAt) {
        translationRepository.save(PoiTranslation.builder()
                .poi(poi)
                .languageCode(languageCode)
                .title("Tiêu đề " + languageCode)
                .summary("Tóm tắt " + languageCode)
                .description("Mô tả " + languageCode)
                .audioStatus(audioStatus)
                .audioLastAttemptAt(attemptAt)
                .build());
    }

    private Set<Long> filter(String overallStatus, String languageStatus) {
        return filter(overallStatus, languageStatus, null, null);
    }

    private Set<Long> filter(String overallStatus, String languageStatus, Long zoneId, String search) {
        Page<AdminPoiListItemDto> page = poiContentService.getAdminPois(
                zoneId, null, null, search, null, overallStatus, languageStatus, ONE_PAGE);
        // count query phải khớp đúng số dòng trả về (bộ lọc tính cả phân trang phía server)
        assertThat(page.getTotalElements()).isEqualTo(page.getContent().size());
        return page.getContent().stream().map(AdminPoiListItemDto::getId).collect(Collectors.toSet());
    }

    @Test
    @DisplayName("overallStatus lọc đúng từng nhóm (theo zone của test, loại dữ liệu demo)")
    void overallStatusFilters() {
        assertThat(filter("ACTIVE", null, zone1Id, null))
                .containsExactlyInAnyOrder(id("POI_A"), id("POI_G"), id("POI_H"));
        assertThat(filter("ACTIVE", null, zone2Id, null)).containsExactly(id("POI_I"));
        assertThat(filter("NEEDS_ATTENTION", null, zone1Id, null))
                .containsExactlyInAnyOrder(id("POI_B"), id("POI_D"), id("POI_E"), id("POI_F"));
        assertThat(filter("HIDDEN", null, zone1Id, null)).containsExactly(id("POI_C"));
        assertThat(filter(null, null, zone1Id, null)).hasSize(8);
    }

    @Test
    @DisplayName("languageStatus lọc đúng nhóm lỗi và nhóm chờ xử lý")
    void languageStatusFilters() {
        assertThat(filter(null, "ERROR", zone1Id, null)).containsExactly(id("POI_E"));
        assertThat(filter(null, "PENDING", zone1Id, null))
                .containsExactlyInAnyOrder(id("POI_D"), id("POI_F"), id("POI_G"), id("POI_H"));
    }

    @Test
    @DisplayName("lọc kép overallStatus + languageStatus chỉ trả điểm thỏa cả hai")
    void combinedFilters() {
        assertThat(filter("ACTIVE", "PENDING", zone1Id, null))
                .containsExactlyInAnyOrder(id("POI_G"), id("POI_H"));
        assertThat(filter("HIDDEN", "ERROR", zone1Id, null)).isEmpty();
    }

    @Test
    @DisplayName("bộ lọc mới kết hợp zoneId/search vẫn đúng số đếm")
    void combineWithExistingFilters() {
        assertThat(filter("ACTIVE", null, zone2Id, null))
                .containsExactly(id("POI_I"));
        assertThat(filter(null, null, zone1Id, "poi_e")).containsExactly(id("POI_E"));
    }

    @Test
    @DisplayName("lọc SQL khớp với cách service tự phân loại (resolveOverallStatus/languageSummary)")
    void sqlFilterMatchesJavaClassification() {
        Page<AdminPoiListItemDto> all = poiContentService.getAdminPois(
                null, null, null, null, null, null, null, ONE_PAGE);

        Map<String, Set<Long>> byOverall = all.getContent().stream().collect(
                Collectors.groupingBy(
                        row -> String.valueOf(row.getOverallStatus()),
                        Collectors.mapping(AdminPoiListItemDto::getId, Collectors.toSet())));

        assertThat(byOverall.getOrDefault("ACTIVE", Set.of())).isEqualTo(filter("ACTIVE", null));
        assertThat(byOverall.getOrDefault("NEEDS_ATTENTION", Set.of())).isEqualTo(filter("NEEDS_ATTENTION", null));
        assertThat(byOverall.getOrDefault("HIDDEN", Set.of())).isEqualTo(filter("HIDDEN", null));

        Set<Long> errorExpected = all.getContent().stream()
                .filter(row -> row.getLanguageSummary().getFailed() > 0)
                .map(AdminPoiListItemDto::getId)
                .collect(Collectors.toSet());
        assertThat(errorExpected).isEqualTo(filter(null, "ERROR"));

        Set<Long> pendingExpected = all.getContent().stream()
                .filter(row -> row.getLanguageSummary().getPending() > 0)
                .map(AdminPoiListItemDto::getId)
                .collect(Collectors.toSet());
        assertThat(pendingExpected).isEqualTo(filter(null, "PENDING"));
    }
}
