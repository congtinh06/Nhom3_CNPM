package com.echora.content.repository;

import com.echora.content.dto.ProductFilterRequest;
import com.echora.content.entity.Category;
import com.echora.content.entity.NewsArticle;
import com.echora.content.entity.Poi;
import com.echora.content.entity.Product;
import com.echora.content.entity.Zone;
import com.echora.content.model.ProductCategory;
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
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm chứng hành vi tìm kiếm trên SQL Server thật (collation Vietnamese_100_CI_AS)
 * sau khi bỏ LOWER() bọc cột trong NewsArticleRepository và ProductSpecification.
 */
@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "echora.publish-retry.enabled=false"
})
@Testcontainers
class ProductAndNewsQueryIntegrationTest {

    private static final PageRequest ONE_PAGE = PageRequest.of(0, 20);
    private static final AtomicBoolean SEEDED = new AtomicBoolean(false);

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

    @BeforeEach
    void seedVietnameseSearchFixtures() {
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
}
