package com.echora.content.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.AMQP;
import com.echora.content.config.RabbitMQConfig;
import com.echora.content.dto.CreatePoiRequest;
import com.echora.content.dto.PoiDetailDto;
import com.echora.content.dto.PoiPublishStatusDto;
import com.echora.content.dto.UpdatePoiRequest;
import com.echora.content.entity.PublishStatus;
import com.echora.content.event.PoiAudioReadyEvent;
import com.echora.content.service.PoiAudioUpdateService;
import com.echora.content.service.PoiContentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Test tích hợp với SQL Server + RabbitMQ thật (Testcontainers).
 * Producer giả lập "service khác" bằng amqp-client thô: KHÔNG có header __TypeId__,
 * chứng minh listener vẫn chuyển JSON sang đúng kiểu nhờ tham số method (TypePrecedence.INFERRED).
 */
@SpringBootTest(properties = {
        "echora.publish-retry.enabled=false",
        "internal.api-key=test-internal-key",
        "spring.rabbitmq.listener.simple.retry.initial-interval=200ms",
        "spring.rabbitmq.listener.simple.retry.max-interval=500ms"
})
@Testcontainers
class PoiAudioListenerIntegrationTest {

    @Container
    static final MSSQLServerContainer<?> MSSQL =
            new MSSQLServerContainer<>(DockerImageName.parse("mcr.microsoft.com/mssql/server:2022-latest"))
                    .acceptLicense()
                    .withInitScript("init-test-db.sql");

    @Container
    @ServiceConnection
    static final RabbitMQContainer RABBIT = new RabbitMQContainer(DockerImageName.parse("rabbitmq:3-management"))
            // RabbitMQ can take longer than the 60s default on a cold or loaded machine.
            .withStartupTimeout(Duration.ofMinutes(3));

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> MSSQL.getJdbcUrl() + ";databaseName=echora_content_test");
        registry.add("spring.datasource.username", MSSQL::getUsername);
        registry.add("spring.datasource.password", MSSQL::getPassword);
    }

    private static final Duration WAIT = Duration.ofSeconds(20);
    private static final String CAPTURE_QUEUE = "it.capture.poi.created";

    @Autowired private JdbcTemplate jdbc;
    @Autowired private RabbitTemplate rabbitTemplate;
    @Autowired private AmqpAdmin amqpAdmin;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PoiContentService poiContentService;
    @SpyBean private PoiAudioUpdateService poiAudioUpdateService;

    // ------------------------------------------------------------------ helpers

    private long poiId(String code) {
        Long id = jdbc.queryForObject("SELECT id FROM dbo.poi WHERE code = ?", Long.class, code);
        assertThat(id).isNotNull();
        return id;
    }

    private List<Map<String, Object>> translation(long poiId, String lang) {
        return jdbc.queryForList(
                "SELECT title, audio_url, audio_status, audio_duration_seconds FROM dbo.poi_translation WHERE poi_id = ? AND language_code = ?",
                poiId, lang);
    }

    /** Gửi như một service khác: client AMQP thô, không qua Spring, không header __TypeId__. */
    private static void publishRaw(String routingKey, String body, AMQP.BasicProperties props) throws Exception {
        com.rabbitmq.client.ConnectionFactory cf = new com.rabbitmq.client.ConnectionFactory();
        cf.setHost(RABBIT.getHost());
        cf.setPort(RABBIT.getAmqpPort());
        cf.setUsername(RABBIT.getAdminUsername());
        cf.setPassword(RABBIT.getAdminPassword());
        try (com.rabbitmq.client.Connection connection = cf.newConnection();
             com.rabbitmq.client.Channel channel = connection.createChannel()) {
            channel.basicPublish(RabbitMQConfig.EXCHANGE_NAME, routingKey, props, body.getBytes(StandardCharsets.UTF_8));
        }
    }

    private static AMQP.BasicProperties jsonNoTypeId() {
        return new AMQP.BasicProperties.Builder().contentType("application/json").contentEncoding("UTF-8").build();
    }

    private String readyJson(long poiId, String lang, String title) {
        String hash = expectedHashFor(poiId, lang);
        return """
                {"poiId": %d, "languageCode": "%s", "title": "%s",
                 "summary": "summary %s", "description": "description %s", "historicalSignificance": null,
                 "audioUrl": "http://localhost:8083/api/tts/audio/poi_%d_%s.mp3",
                 "audioDurationSeconds": 95, "audioStatus": "READY", "contentHash": "%s"}
                """.formatted(poiId, lang, title, lang, lang, poiId, lang, hash);
    }

    /**
     * Giống quy ước của PoiAudioUpdateService.expectedHashFor: hash từ chính bản MANUAL nếu có,
     * ngược lại hash từ bản tiếng Việt nguồn.
     */
    private String expectedHashFor(long poiId, String lang) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT title, summary, description, historical_significance, translation_source FROM dbo.poi_translation WHERE poi_id = ? AND language_code = ?",
                poiId, lang);
        if (!rows.isEmpty() && "MANUAL".equals(rows.get(0).get("translation_source"))) {
            Map<String, Object> r = rows.get(0);
            return com.echora.content.util.ContentHashUtils.computeNarrationHash(
                    lang,
                    (String) r.get("description")
            );
        }

        List<Map<String, Object>> viRows = jdbc.queryForList(
                "SELECT title, summary, description, historical_significance FROM dbo.poi_translation WHERE poi_id = ? AND language_code = 'vi'",
                poiId);
        if (viRows.isEmpty()) {
            return "hash-" + lang;
        }
        Map<String, Object> r = viRows.get(0);
        return com.echora.content.util.ContentHashUtils.computeNarrationHash(
                lang,
                (String) r.get("description")
        );
    }

    private Message awaitDeadLetter(String dlq, Predicate<String> bodyMatches) {
        long deadline = System.currentTimeMillis() + WAIT.toMillis();
        while (System.currentTimeMillis() < deadline) {
            Message message = rabbitTemplate.receive(dlq, 1000);
            if (message != null && bodyMatches.test(new String(message.getBody(), StandardCharsets.UTF_8))) {
                return message;
            }
        }
        return null;
    }

    private JsonNode managementApi(String path) throws Exception {
        String auth = Base64.getEncoder().encodeToString(
                (RABBIT.getAdminUsername() + ":" + RABBIT.getAdminPassword()).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder(URI.create(RABBIT.getHttpUrl() + path))
                .header("Authorization", "Basic " + auth).GET().build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        return objectMapper.readTree(response.body());
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("poi.audio.ready JSON không có __TypeId__ -> upsert bản dịch READY, giữ nguyên tiếng Nhật")
    void readyWithoutTypeIdIsApplied() throws Exception {
        long id = poiId("POI_BUU_DIEN_01");
        String title = "サイゴン中央郵便局";

        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_READY, readyJson(id, "ja", title), jsonNoTypeId());

        await().atMost(WAIT).untilAsserted(() -> {
            List<Map<String, Object>> rows = translation(id, "ja");
            assertThat(rows).hasSize(1);
            assertThat(rows.get(0).get("title")).isEqualTo(title);
            assertThat(rows.get(0).get("audio_status")).isEqualTo("READY");
            assertThat((String) rows.get(0).get("audio_url")).endsWith("poi_" + id + "_ja.mp3");
        });
    }

    @Test
    @DisplayName("poi.audio.ready không có BẤT KỲ property nào (không content_type, không header) vẫn xử lý được")
    void readyWithoutAnyPropertiesIsApplied() throws Exception {
        long id = poiId("POI_DUC_BA_01");
        String title = "사이공 노트르담 대성당";

        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_READY, readyJson(id, "ko", title), null);

        await().atMost(WAIT).untilAsserted(() -> {
            List<Map<String, Object>> rows = translation(id, "ko");
            assertThat(rows).hasSize(1);
            assertThat(rows.get(0).get("title")).isEqualTo(title);
        });
    }

    @Test
    @DisplayName("__TypeId__ trỏ tới class của service khác (không tồn tại ở đây) vẫn xử lý được")
    void readyWithForeignTypeIdIsApplied() throws Exception {
        long id = poiId("POI_BEN_THANH_01");
        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                .contentType("application/json")
                .headers(Map.of("__TypeId__", "com.echora.translation.event.PoiAudioReadyEvent"))
                .build();

        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_READY, readyJson(id, "en", "Ben Thanh Market"), props);

        await().atMost(WAIT).untilAsserted(() -> assertThat(translation(id, "en")).hasSize(1));
    }

    @Test
    @DisplayName("poi.audio.failed không có __TypeId__, không kèm text -> bản dịch có sẵn chuyển FAILED")
    void failedWithoutTypeIdIsApplied() throws Exception {
        long id = poiId("POI_THIEN_HAU_01");
        String hash = expectedHashFor(id, "vi");
        String json = """
                {"poiId": %d, "languageCode": "vi", "audioStatus": "FAILED_TTS", "errorMessage": "Edge TTS timeout", "contentHash": "%s"}
                """.formatted(id, hash);

        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_FAILED, json, jsonNoTypeId());

        await().atMost(WAIT).untilAsserted(() -> {
            List<Map<String, Object>> rows = translation(id, "vi");
            assertThat(rows).hasSize(1);
            assertThat(rows.get(0).get("audio_status")).isEqualTo("FAILED");
            assertThat(rows.get(0).get("audio_url")).isNull();
        });
    }

    @Test
    @DisplayName("POI không tồn tại -> ném exception, xử lý đúng 3 lần rồi sang poi.audio.ready.dlq (không requeue vô hạn)")
    void unknownPoiIsRetriedThenDeadLettered() throws Exception {
        long unknownId = 999_999L;

        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_READY, readyJson(unknownId, "en", "Ghost"), jsonNoTypeId());

        Message dead = awaitDeadLetter(RabbitMQConfig.DLQ_POI_AUDIO_READY, body -> body.contains("\"poiId\": " + unknownId));
        assertThat(dead).as("message must reach DLQ").isNotNull();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> xDeath = (List<Map<String, Object>>) dead.getMessageProperties().getHeaders().get("x-death");
        assertThat(xDeath).isNotEmpty();
        assertThat(xDeath.get(0).get("reason").toString()).isEqualTo("rejected");
        assertThat(xDeath.get(0).get("queue").toString()).isEqualTo(RabbitMQConfig.QUEUE_POI_AUDIO_READY);

        verify(poiAudioUpdateService, times(3))
                .applyAudioReady(argThat((PoiAudioReadyEvent e) -> e != null && Long.valueOf(unknownId).equals(e.getPoiId())));
        assertThat(translation(unknownId, "en")).isEmpty();
    }

    @Test
    @DisplayName("Payload thiếu audioUrl -> sang DLQ ngay, KHÔNG retry")
    void invalidPayloadIsDeadLetteredWithoutRetry() throws Exception {
        long id = poiId("POI_CAU_BA_SON_01");
        String json = """
                {"poiId": %d, "languageCode": "fr", "title": "Pont", "summary": "s", "description": "d"}
                """.formatted(id);

        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_READY, json, jsonNoTypeId());

        Message dead = awaitDeadLetter(RabbitMQConfig.DLQ_POI_AUDIO_READY, body -> body.contains("\"languageCode\": \"fr\""));
        assertThat(dead).isNotNull();
        verify(poiAudioUpdateService, times(1))
                .applyAudioReady(argThat((PoiAudioReadyEvent e) -> e != null && "fr".equals(e.getLanguageCode())));
        assertThat(translation(id, "fr")).isEmpty();
    }

    @Test
    @DisplayName("JSON hỏng -> sang DLQ, consumer không bị kẹt")
    void malformedJsonIsDeadLettered() throws Exception {
        publishRaw(RabbitMQConfig.ROUTING_KEY_POI_AUDIO_FAILED, "{not-json MALFORMED_MARKER", jsonNoTypeId());

        Message dead = awaitDeadLetter(RabbitMQConfig.DLQ_POI_AUDIO_FAILED, body -> body.contains("MALFORMED_MARKER"));
        assertThat(dead).isNotNull();
    }

    @Test
    @DisplayName("Queue chính có x-dead-letter-exchange = echora.dlx và DLQ được bind đúng")
    void queuesHaveDeadLetterArguments() throws Exception {
        for (String[] pair : new String[][]{
                {RabbitMQConfig.QUEUE_POI_AUDIO_READY, RabbitMQConfig.DLQ_POI_AUDIO_READY},
                {RabbitMQConfig.QUEUE_POI_AUDIO_FAILED, RabbitMQConfig.DLQ_POI_AUDIO_FAILED}}) {
            JsonNode args = managementApi("/api/queues/%2F/" + pair[0]).get("arguments");
            assertThat(args.get("x-dead-letter-exchange").asText()).isEqualTo(RabbitMQConfig.DLX_NAME);
            assertThat(args.get("x-dead-letter-routing-key").asText()).isEqualTo(pair[1]);

            JsonNode bindings = managementApi("/api/exchanges/%2F/" + RabbitMQConfig.DLX_NAME + "/bindings/source");
            assertThat(bindings.findValuesAsText("destination")).contains(pair[1]);
        }
    }

    @Test
    @DisplayName("Tạo POI: publish chạy SAU commit -> message vào poi.created.queue -> publishStatus chuyển PUBLISHED")
    void createPoiRecordsPublishOutcome() throws Exception {
        Long zoneId = jdbc.queryForObject("SELECT id FROM dbo.zone WHERE code = 'D1_HISTORIC'", Long.class);
        Long categoryId = jdbc.queryForObject("SELECT id FROM dbo.category WHERE code = 'HISTORIC'", Long.class);

        PoiDetailDto created = poiContentService.createPoi(CreatePoiRequest.builder()
                .zoneId(zoneId).categoryId(categoryId)
                .code("POI_IT_PUBLISH").qrToken("qr-it-publish").name("Bảo tàng Thành phố")
                .latitude(new BigDecimal("10.7760000")).longitude(new BigDecimal("106.7000000"))
                .title("Bảo tàng Thành phố Hồ Chí Minh").summary("Tóm tắt").description("Mô tả")
                .build());

        // Do queue poi.created.queue đã được khai báo và bind -> message được route ngay -> publish_status = PUBLISHED
        await().atMost(WAIT).untilAsserted(() -> {
            PoiPublishStatusDto status = poiContentService.getPublishStatus(created.getId());
            assertThat(status.getPublishStatus()).isEqualTo(PublishStatus.PUBLISHED);
            assertThat(status.getLastPublishError()).isNull();
            assertThat(status.getPublishAttempts()).isGreaterThanOrEqualTo(1);
        });

        // Kiểm tra message thực tế trong poi.created.queue
        Message message = rabbitTemplate.receive(RabbitMQConfig.QUEUE_POI_CREATED, 5000);
        assertThat(message).isNotNull();
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        assertThat(body).contains("\"poiId\":" + created.getId()).contains("Bảo tàng Thành phố Hồ Chí Minh");

        // Admin republish: vẫn PUBLISHED và gửi message mới
        PoiPublishStatusDto repub = poiContentService.republish(created.getId());
        assertThat(repub.getPublishStatus()).isEqualTo(PublishStatus.PUBLISHED);
    }

    @Test
    @DisplayName("Cập nhật POI: đổi nội dung tiếng Việt -> xuất hiện đúng 1 message trên poi.updated.queue; chỉ đổi tọa độ -> không có message")
    void updatePoiPublishesOnlyWhenVietnameseContentChanges() throws Exception {
        Long zoneId = jdbc.queryForObject("SELECT id FROM dbo.zone WHERE code = 'D1_HISTORIC'", Long.class);
        Long categoryId = jdbc.queryForObject("SELECT id FROM dbo.category WHERE code = 'HISTORIC'", Long.class);

        // 1. Tạo POI ban đầu
        PoiDetailDto created = poiContentService.createPoi(CreatePoiRequest.builder()
                .zoneId(zoneId).categoryId(categoryId)
                .code("POI_IT_UPDATE").qrToken("qr-it-update").name("Bảo tàng Cũ")
                .latitude(new BigDecimal("10.7760000")).longitude(new BigDecimal("106.7000000"))
                .title("Bảo tàng Cũ").summary("Tóm tắt cũ").description("Mô tả cũ")
                .historicalSignificance("Ý nghĩa cũ")
                .build());

        // Lấy message poi.created để dọn sạch queue
        Message createdMsg = rabbitTemplate.receive(RabbitMQConfig.QUEUE_POI_CREATED, 5000);
        assertThat(createdMsg).isNotNull();

        // 2. Chỉ đổi tọa độ / địa chỉ / thumbnail / category (nội dung tiếng Việt giữ nguyên)
        UpdatePoiRequest coordOnlyReq = UpdatePoiRequest.builder()
                .version(0L)
                .categoryId(categoryId)
                .name("Bảo tàng Cũ")
                .latitude(new BigDecimal("10.7780000"))
                .longitude(new BigDecimal("106.7020000"))
                .triggerRadiusMeters(60)
                .address("Địa chỉ mới")
                .thumbnailUrl("/images/new.jpg")
                .title("Bảo tàng Cũ")
                .summary("Tóm tắt cũ")
                .description("Mô tả cũ")
                .historicalSignificance("Ý nghĩa cũ")
                .build();

        poiContentService.updatePoi(created.getId(), coordOnlyReq);

        // Đảm bảo KHÔNG có message nào trên poi.updated.queue
        Message noMsg = rabbitTemplate.receive(RabbitMQConfig.QUEUE_POI_UPDATED, 1000);
        assertThat(noMsg).isNull();

        // 3. Đổi nội dung tiếng Việt (title, summary, description, historicalSignificance)
        UpdatePoiRequest contentReq = UpdatePoiRequest.builder()
                .version(1L)
                .categoryId(categoryId)
                .name("Bảo tàng Mới")
                .latitude(new BigDecimal("10.7780000"))
                .longitude(new BigDecimal("106.7020000"))
                .triggerRadiusMeters(60)
                .address("Địa chỉ mới")
                .thumbnailUrl("/images/new.jpg")
                .title("Bảo tàng Mới Cập Nhật")
                .summary("Tóm tắt mới")
                .description("Mô tả chi tiết mới")
                .historicalSignificance("Ý nghĩa lịch sử mới")
                .build();

        poiContentService.updatePoi(created.getId(), contentReq);

        // Chờ publishStatus chuyển PUBLISHED
        await().atMost(WAIT).untilAsserted(() -> {
            PoiPublishStatusDto status = poiContentService.getPublishStatus(created.getId());
            assertThat(status.getPublishStatus()).isEqualTo(PublishStatus.PUBLISHED);
            assertThat(status.getLastPublishError()).isNull();
        });

        // Kiểm tra xuất hiện ĐÚNG 1 message trên poi.updated.queue
        Message updatedMsg = rabbitTemplate.receive(RabbitMQConfig.QUEUE_POI_UPDATED, 5000);
        assertThat(updatedMsg).isNotNull();
        String body = new String(updatedMsg.getBody(), StandardCharsets.UTF_8);
        assertThat(body).contains("\"poiId\":" + created.getId())
                .contains("Bảo tàng Mới Cập Nhật")
                .contains("Tóm tắt mới");

        // Đảm bảo không còn message thừa nào khác trên queue
        Message extraMsg = rabbitTemplate.receive(RabbitMQConfig.QUEUE_POI_UPDATED, 500);
        assertThat(extraMsg).isNull();
    }

    @Test
    @DisplayName("Seed tuyến: tên tiếng Việt đúng dấu, điểm dừng theo stop_order")
    void routeSeedIsUnicodeAndOrdered() {
        List<String> stops = jdbc.queryForList("""
                SELECT p.code FROM dbo.poi p JOIN dbo.route r ON r.id = p.route_id
                WHERE r.name = N'Tuyến Kiến trúc Trung tâm Quận 1' ORDER BY p.stop_order
                """, String.class);
        assertThat(stops).containsExactly("POI_DUC_BA_01", "POI_BUU_DIEN_01", "POI_BEN_THANH_01");
    }

    @Test
    @DisplayName("4 khu vực đã seed trong database: không cặp zone nào có khoảng cách tâm nhỏ hơn tổng bán kính (Haversine)")
    void seededZonesInDatabaseDoNotOverlap() {
        List<Map<String, Object>> zones = jdbc.queryForList(
                "SELECT code, center_lat, center_lng, radius_meters FROM dbo.zone WHERE is_active = 1");
        assertThat(zones).hasSize(4);

        for (int i = 0; i < zones.size(); i++) {
            for (int j = i + 1; j < zones.size(); j++) {
                Map<String, Object> z1 = zones.get(i);
                Map<String, Object> z2 = zones.get(j);

                BigDecimal lat1 = (BigDecimal) z1.get("center_lat");
                BigDecimal lng1 = (BigDecimal) z1.get("center_lng");
                int r1 = ((Number) z1.get("radius_meters")).intValue();

                BigDecimal lat2 = (BigDecimal) z2.get("center_lat");
                BigDecimal lng2 = (BigDecimal) z2.get("center_lng");
                int r2 = ((Number) z2.get("radius_meters")).intValue();

                double dist = com.echora.content.util.GeoUtils.haversineMeters(lat1, lng1, lat2, lng2);
                double sumR = r1 + r2;

                assertThat(dist)
                        .as("Zone %s and %s distance (%.1fm) must be >= sum of radii (%.1fm)",
                                z1.get("code"), z2.get("code"), dist, sumR)
                        .isGreaterThanOrEqualTo(sumR);
            }
        }
    }
}
