package com.echora.content.repository;

import com.echora.content.dto.ProductDto;
import com.echora.content.dto.ProductFilterRequest;
import com.echora.content.entity.Category;
import com.echora.content.entity.NewsArticle;
import com.echora.content.entity.Poi;
import com.echora.content.entity.Product;
import com.echora.content.entity.Zone;
import com.echora.content.model.ProductCategory;
import com.echora.content.service.ProductService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm chứng truy vấn thật trên SQL Server (collation Vietnamese_100_CI_AS):
 * 1. Tìm kiếm tiếng Việt có dấu không phân biệt hoa thường sau khi bỏ LOWER().
 * 2. @EntityGraph(attributePaths = {"poi"}) cho findAll(Specification, Pageable) trên trang 20 sản phẩm
 *    chỉ phát sinh truy vấn JOIN + COUNT mà không bắn 20 câu SELECT poi riêng lẻ (N+1).
 */
@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "echora.publish-retry.enabled=false",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
@Testcontainers
@Import(ProductAndNewsQueryIntegrationTest.SqlCaptureConfig.class)
@ExtendWith(OutputCaptureExtension.class)
class ProductAndNewsQueryIntegrationTest {

    private static final PageRequest ONE_PAGE = PageRequest.of(0, 20);
    private static final AtomicBoolean SEEDED = new AtomicBoolean(false);
    private static final List<String> CAPTURED_SQL = new CopyOnWriteArrayList<>();

    @TestConfiguration
    static class SqlCaptureConfig {
        @Bean
        HibernatePropertiesCustomizer sqlInspectorCustomizer() {
            return props -> props.put(
                    AvailableSettings.STATEMENT_INSPECTOR,
                    (StatementInspector) sql -> {
                        CAPTURED_SQL.add(sql);
                        return sql;
                    });
        }
    }

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

    @Autowired
    private ZoneRepository zoneRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private PoiRepository poiRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private NewsArticleRepository newsArticleRepository;
    @Autowired
    private ProductService productService;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void seedFixtures() {
        if (!SEEDED.compareAndSet(false, true)) {
            return;
        }

        Zone zone = zoneRepository.save(Zone.builder()
                .code("ZONE_VN_SEARCH")
                .name("Khu kiểm thử tìm kiếm")
                .centerLat(new BigDecimal("10.7700000"))
                .centerLng(new BigDecimal("106.7000000"))
                .build());
        Category category = categoryRepository.save(Category.builder()
                .code("CAT_VN_SEARCH")
                .nameVi("Văn hóa")
                .nameEn("Culture")
                .build());
        Poi poi = poiRepository.save(Poi.builder()
                .zone(zone)
                .category(category)
                .code("POI_VN_SEARCH")
                .qrToken("QR_VN_SEARCH")
                .slug("poi-vn-search")
                .name("Điểm tìm kiếm tiếng Việt")
                .latitude(new BigDecimal("10.7700000"))
                .longitude(new BigDecimal("106.7000000"))
                .triggerRadiusMeters(50)
                .status("ACTIVE")
                .publishStatus("PUBLISHED")
                .build());

        for (int i = 1; i <= 25; i++) {
            String suffix = String.format("%02d", i);
            Poi distinctPoi = poiRepository.save(Poi.builder()
                    .zone(zone)
                    .category(category)
                    .code("POI_EG_" + suffix)
                    .qrToken("QR_EG_" + suffix)
                    .slug("poi-eg-" + suffix)
                    .name("Điểm N+1 " + suffix)
                    .latitude(new BigDecimal("10.7700000"))
                    .longitude(new BigDecimal("106.7000000"))
                    .triggerRadiusMeters(50)
                    .status("ACTIVE")
                    .publishStatus("PUBLISHED")
                    .build());
            productRepository.save(Product.builder()
                    .slug("sp-eg-" + suffix)
                    .name("Sản phẩm EntityGraphCheck " + suffix)
                    .category(ProductCategory.SOUVENIR)
                    .shortDescription("Quà lưu niệm gắn POI riêng " + suffix)
                    .price(new BigDecimal("50000"))
                    .reviewsCount(30 - i)
                    .sortOrder(i)
                    .poi(distinctPoi)
                    .isActive(true)
                    .build());
        }

        productRepository.save(Product.builder()
                .slug("sp-vn-banh-duc-nong")
                .name("Bánh Đúc Nóng Thủ Công")
                .category(ProductCategory.FOOD)
                .shortDescription("Món ăn dân dã dẻo thơm")
                .price(new BigDecimal("35000"))
                .poi(poi)
                .isActive(true)
                .build());
        productRepository.save(Product.builder()
                .slug("sp-vn-kham-trai")
                .name("Hộp Sơn Mài Mỹ Nghệ")
                .category(ProductCategory.SOUVENIR)
                .shortDescription("Họa tiết ĐỈNH NÓN KHẢM TRAI cổ điển")
                .price(new BigDecimal("95000"))
                .poi(poi)
                .isActive(true)
                .build());
        productRepository.save(Product.builder()
                .slug("sp-vn-banh-duc-khong-dau")
                .name("Banh Duc Nong Thu Cong")
                .category(ProductCategory.FOOD)
                .shortDescription("Hoa tiet dinh non kham trai")
                .price(new BigDecimal("25000"))
                .poi(poi)
                .isActive(true)
                .build());
        productRepository.save(Product.builder()
                .slug("sp-vn-banh-duc-an")
                .name("Bánh Đúc Nóng Đã Ẩn")
                .category(ProductCategory.FOOD)
                .shortDescription("Không hiển thị công khai")
                .price(new BigDecimal("30000"))
                .poi(poi)
                .isActive(false)
                .build());

        newsArticleRepository.save(NewsArticle.builder()
                .slug("news-vn-kham-trai")
                .title("Nghệ thuật Khảm Trai truyền thống")
                .category("van-hoa")
                .summary("Tinh hoa thủ công mỹ nghệ")
                .isActive(true)
                .build());
        newsArticleRepository.save(NewsArticle.builder()
                .slug("news-vn-banh-duc-nong")
                .title("Chợ Đêm Ẩm Thực Ven Sông")
                .category("diem-den")
                .summary("Món BÁNH ĐÚC NÓNG hổi thơm nức")
                .isActive(true)
                .build());
        newsArticleRepository.save(NewsArticle.builder()
                .slug("news-vn-kham-trai-khong-dau")
                .title("Nghe thuat Kham Trai khong dau")
                .category("van-hoa")
                .summary("Mo ta khong dau")
                .isActive(true)
                .build());
        newsArticleRepository.save(NewsArticle.builder()
                .slug("news-vn-kham-trai-tam-an")
                .title("Bài viết Khảm Trai tạm ẩn")
                .category("van-hoa")
                .summary("Chưa xuất bản")
                .isActive(false)
                .build());
    }

    @Test
    @DisplayName("ProductSpecification tìm tiếng Việt có dấu không phân biệt hoa thường đúng dưới Vietnamese_100_CI_AS")
    void productSpecification_VietnameseAccentedSearch_IsCaseInsensitiveAndAccentSensitive() {
        Page<Product> lowerAccented = productRepository.findAll(
                ProductSpecification.filter(ProductFilterRequest.builder().keyword("bánh đúc nóng").build()),
                ONE_PAGE);
        assertThat(lowerAccented.getContent())
                .extracting(Product::getSlug)
                .containsExactly("sp-vn-banh-duc-nong");

        Page<Product> upperAccented = productRepository.findAll(
                ProductSpecification.filter(ProductFilterRequest.builder().keyword("BÁNH ĐÚC NÓNG").build()),
                ONE_PAGE);
        assertThat(upperAccented.getContent())
                .extracting(Product::getSlug)
                .containsExactly("sp-vn-banh-duc-nong");

        Page<Product> shortDescDWithStroke = productRepository.findAll(
                ProductSpecification.filter(ProductFilterRequest.builder().keyword("đỉnh nón khảm trai").build()),
                ONE_PAGE);
        assertThat(shortDescDWithStroke.getContent())
                .extracting(Product::getSlug)
                .containsExactly("sp-vn-kham-trai");

        Page<Product> unaccented = productRepository.findAll(
                ProductSpecification.filter(ProductFilterRequest.builder().keyword("banh duc nong").build()),
                ONE_PAGE);
        assertThat(unaccented.getContent())
                .extracting(Product::getSlug)
                .containsExactly("sp-vn-banh-duc-khong-dau");
    }

    @Test
    @DisplayName("NewsArticleRepository tìm tiếng Việt có dấu không phân biệt hoa thường đúng dưới Vietnamese_100_CI_AS")
    void newsArticleRepository_VietnameseAccentedSearch_IsCaseInsensitiveAndAccentSensitive() {
        Page<NewsArticle> lowerTitle = newsArticleRepository.findActiveNews(null, "khảm trai", ONE_PAGE);
        assertThat(lowerTitle.getContent())
                .extracting(NewsArticle::getSlug)
                .containsExactly("news-vn-kham-trai");

        Page<NewsArticle> upperTitle = newsArticleRepository.findActiveNews(null, "KHẢM TRAI", ONE_PAGE);
        assertThat(upperTitle.getContent())
                .extracting(NewsArticle::getSlug)
                .containsExactly("news-vn-kham-trai");

        Page<NewsArticle> lowerSummaryMatch = newsArticleRepository.findActiveNews(null, "bánh đúc nóng", ONE_PAGE);
        assertThat(lowerSummaryMatch.getContent())
                .extracting(NewsArticle::getSlug)
                .containsExactly("news-vn-banh-duc-nong");

        Page<NewsArticle> unaccented = newsArticleRepository.findActiveNews(null, "kham trai", ONE_PAGE);
        assertThat(unaccented.getContent())
                .extracting(NewsArticle::getSlug)
                .containsExactly("news-vn-kham-trai-khong-dau");

        Page<NewsArticle> adminUpperAll = newsArticleRepository.findAdminNews(null, "KHẢM TRAI", null, ONE_PAGE);
        assertThat(adminUpperAll.getContent())
                .extracting(NewsArticle::getSlug)
                .containsExactlyInAnyOrder("news-vn-kham-trai", "news-vn-kham-trai-tam-an");
    }

    @Test
    @DisplayName("findAll(Specification, Pageable) trang 20 sản phẩm fetch sẵn POI (2 SQL: JOIN + COUNT, không 20 SELECT poi)")
    void productRepository_FindAllPage20_FetchesPoiWithoutNPlusOne(CapturedOutput output) {
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);

        // 1. Kiểm tra trực tiếp ProductRepository.findAll(Specification, Pageable) trong transaction mới (L1 cache rỗng)
        stats.clear();
        CAPTURED_SQL.clear();

        ProductFilterRequest repoRequest = ProductFilterRequest.builder()
                .keyword("EntityGraphCheck")
                .build();
        Pageable repoPageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "sortOrder"));

        transactionTemplate.executeWithoutResult(tx -> {
            Page<Product> page = productRepository.findAll(ProductSpecification.filter(repoRequest), repoPageable);
            assertThat(page.getContent()).hasSize(20);
            assertThat(page.getTotalElements()).isEqualTo(25L);

            List<String> poiSlugs = page.getContent().stream()
                    .map(product -> product.getPoi().getSlug())
                    .distinct()
                    .toList();
            assertThat(poiSlugs).hasSize(20);
        });

        assertThat(stats.getEntityFetchCount()).isZero();
        assertThat(stats.getPrepareStatementCount()).isEqualTo(2L);
        assertThat(CAPTURED_SQL).hasSize(2);
        assertThat(CAPTURED_SQL)
                .anySatisfy(sql -> assertThat(sql.toLowerCase(Locale.ROOT)).contains("join poi"))
                .anySatisfy(sql -> assertThat(sql.toLowerCase(Locale.ROOT)).contains("count_big("))
                .noneSatisfy(sql -> assertThat(sql.toLowerCase(Locale.ROOT)).contains("from poi"));

        // 2. Kiểm tra qua ProductServiceImpl.getActiveProducts (map ProductDto::fromEntity trên 20 sản phẩm)
        stats.clear();
        CAPTURED_SQL.clear();

        Page<ProductDto> dtoPage = productService.getActiveProducts(ProductFilterRequest.builder()
                .keyword("EntityGraphCheck")
                .page(0)
                .size(20)
                .sortBy("popular")
                .build());

        assertThat(dtoPage.getContent()).hasSize(20);
        assertThat(dtoPage.getTotalElements()).isEqualTo(25L);
        assertThat(dtoPage.getContent())
                .extracting(ProductDto::getPoiId)
                .doesNotContainNull()
                .doesNotHaveDuplicates();
        assertThat(dtoPage.getContent())
                .extracting(ProductDto::getPoiSlug)
                .doesNotContainNull()
                .doesNotHaveDuplicates();
        assertThat(stats.getEntityFetchCount()).isZero();
        assertThat(stats.getPrepareStatementCount()).isEqualTo(2L);
        assertThat(CAPTURED_SQL).hasSize(2);

        // Không có cảnh báo Hibernate HHH90003004 khi phân trang với @EntityGraph trên ToOne
        assertThat(output.getAll()).doesNotContain("HHH90003004");
    }
}
