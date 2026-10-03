package com.antiphishing.poi.service;

import com.antiphishing.poi.dto.NarrationDto;
import com.antiphishing.poi.dto.NearbyItemDto;
import com.antiphishing.poi.dto.NearbyResponseDto;
import com.antiphishing.poi.dto.PoiDto;
import com.antiphishing.poi.entity.PoiCache;
import com.antiphishing.poi.repository.PoiCacheRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PoiServiceImpl implements PoiService {

    private final PoiCacheRepository poiCacheRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${overpass.url:https://overpass-api.de/api/interpreter}")
    private String overpassUrl;

    @Override
    public NearbyResponseDto getNearby(double lat, double lng, int radius, String bank, String lang) {
        String cleanLang = (lang != null && !lang.isBlank()) ? lang.trim().toLowerCase() : "vi";
        String cleanBank = (bank != null && !bank.isBlank() && !bank.equalsIgnoreCase("all") && !bank.equalsIgnoreCase("Tất cả"))
                ? bank.trim()
                : null;
        int effectiveRadius = radius > 0 ? radius : 1500;

        String cacheKey = String.format(Locale.ROOT, "poi_%.4f_%.4f_%d_%s_%s",
                lat, lng, effectiveRadius, cleanBank != null ? cleanBank.toLowerCase() : "all", cleanLang);

        // 1. Kiểm tra cache SQL Server (TTL 24h)
        try {
            Optional<PoiCache> cachedOpt = poiCacheRepository.findByCacheKeyAndExpiresAtAfter(cacheKey, LocalDateTime.now());
            if (cachedOpt.isPresent()) {
                log.info("POI Cache HIT for key={}", cacheKey);
                return objectMapper.readValue(cachedOpt.get().getResponseJson(), NearbyResponseDto.class);
            }
        } catch (Exception ex) {
            log.warn("Lỗi đọc cache POI từ database: {}", ex.getMessage());
        }

        log.info("POI Cache MISS. Querying Overpass API for lat={}, lng={}, radius={}, bank={}", lat, lng, effectiveRadius, cleanBank);

        // 2. Gọi Overpass API
        List<NearbyItemDto> items = fetchFromOverpass(lat, lng, effectiveRadius, cleanBank, cleanLang);

        // Fallback nếu Overpass rỗng hoặc không có kết nối
        if (items.isEmpty()) {
            items = buildFallbackItems(lat, lng, cleanBank, cleanLang);
        }

        if (items.isEmpty()) {
            return null;
        }

        // Tối đa 5 điểm gần nhất
        if (items.size() > 5) {
            items = items.subList(0, 5);
        }

        NearbyItemDto topItem = items.get(0);
        NearbyResponseDto response = NearbyResponseDto.builder()
                .poi(topItem.getPoi())
                .distanceMeters(topItem.getDistanceMeters())
                .narration(topItem.getNarration())
                .nearbyPois(items)
                .build();

        // 3. Cache kết quả vào SQL Server (TTL 24h)
        try {
            String json = objectMapper.writeValueAsString(response);
            PoiCache cacheEntity = PoiCache.builder()
                    .cacheKey(cacheKey)
                    .responseJson(json)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();
            poiCacheRepository.save(cacheEntity);
            log.info("POI results cached successfully for 24h: key={}", cacheKey);
        } catch (Exception ex) {
            log.warn("Không thể lưu cache POI vào DB: {}", ex.getMessage());
        }

        return response;
    }

    private List<NearbyItemDto> fetchFromOverpass(double lat, double lng, int radius, String bank, String lang) {
        List<NearbyItemDto> list = new ArrayList<>();
        try {
            String query = String.format(Locale.ROOT,
                    "[out:json][timeout:15];\n" +
                    "(\n" +
                    "  node[\"amenity\"=\"atm\"](around:%d,%.6f,%.6f);\n" +
                    "  node[\"amenity\"=\"bank\"](around:%d,%.6f,%.6f);\n" +
                    ");\n" +
                    "out body;\n",
                    radius, lat, lng, radius, lat, lng);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            String body = "data=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> resp = restTemplate.postForEntity(overpassUrl, entity, String.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                JsonNode root = objectMapper.readTree(resp.getBody());
                JsonNode elements = root.path("elements");
                if (elements.isArray()) {
                    for (JsonNode node : elements) {
                        double nodeLat = node.path("lat").asDouble();
                        double nodeLon = node.path("lon").asDouble();
                        long id = node.path("id").asLong();
                        JsonNode tags = node.path("tags");

                        String name = tags.path("name").asText("ATM Ngân hàng");
                        String operator = tags.path("operator").asText("");
                        String brand = tags.path("brand").asText("");
                        String amenity = tags.path("amenity").asText("atm");
                        String street = tags.path("addr:street").asText("");
                        String housenumber = tags.path("addr:housenumber").asText("");

                        String detectedBank = !operator.isBlank() ? operator : (!brand.isBlank() ? brand : name);

                        // Lọc theo bank nếu được chỉ định
                        if (bank != null) {
                            String searchKey = bank.toLowerCase();
                            boolean matches = name.toLowerCase().contains(searchKey)
                                    || operator.toLowerCase().contains(searchKey)
                                    || brand.toLowerCase().contains(searchKey);
                            if (!matches) {
                                continue;
                            }
                        }

                        long dist = calculateHaversine(lat, lng, nodeLat, nodeLon);
                        String address = (!housenumber.isBlank() && !street.isBlank())
                                ? housenumber + " " + street
                                : (!street.isBlank() ? street : "TP. Hồ Chí Minh");

                        PoiDto poiDto = PoiDto.builder()
                                .id(id)
                                .name(name)
                                .type(amenity.equalsIgnoreCase("bank") ? "BRANCH" : "ATM")
                                .bankName(detectedBank)
                                .address(address)
                                .latitude(nodeLat)
                                .longitude(nodeLon)
                                .build();

                        NarrationDto narration = buildNarration(poiDto, dist, lang);

                        list.add(NearbyItemDto.builder()
                                .poi(poiDto)
                                .distanceMeters(dist)
                                .narration(narration)
                                .build());
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Lỗi khi truy vấn Overpass API: {}", ex.getMessage());
        }

        // Sắp xếp tăng dần theo khoảng cách
        list.sort(Comparator.comparingLong(NearbyItemDto::getDistanceMeters));
        return list;
    }

    private NarrationDto buildNarration(PoiDto poi, long distanceMeters, String lang) {
        String bank = (poi.getBankName() != null && !poi.getBankName().isBlank()) ? poi.getBankName() : "ngân hàng";
        String address = poi.getAddress();
        String text;
        String ttsLang;

        switch (lang) {
            case "en":
                ttsLang = "en-US";
                text = String.format("You are near %s ATM at %s, approximately %d meters away. Please shield the keypad when entering your PIN and inspect the card reader.",
                        bank, address, distanceMeters);
                break;
            case "ja":
                ttsLang = "ja-JP";
                text = String.format("現在、約%dメートル先にある%sの%s ATMの近くにいます。暗証番号を入力する際はキーパッドを手で隠し、カード挿入口に不審な機器がないかご確認ください。",
                        distanceMeters, address, bank);
                break;
            case "ko":
                ttsLang = "ko-KR";
                text = String.format("현재 약 %d미터 거리에 있는 %s의 %s ATM 근처에 있습니다. 비밀번호를 입력할 때는 키패드를 손으로 가리고 카드 투입구를 주의 깊게 확인하세요.",
                        distanceMeters, address, bank);
                break;
            case "zh":
                ttsLang = "zh-CN";
                text = String.format("您目前靠近位于%s的%s ATM，距离约%d米。输入密码时请遮挡键盘，并仔细检查插卡口是否有异常附加物。",
                        address, bank, distanceMeters);
                break;
            case "vi":
            default:
                ttsLang = "vi-VN";
                text = String.format("Bạn đang ở gần điểm ATM %s tại %s, cách khoảng %d mét. Hãy che bàn phím khi nhập mã PIN và kiểm tra khe đọc thẻ trước khi đưa thẻ vào.",
                        bank, address, distanceMeters);
                break;
        }

        return NarrationDto.builder()
                .text(text)
                .locale(lang)
                .ttsLang(ttsLang)
                .build();
    }

    private List<NearbyItemDto> buildFallbackItems(double lat, double lng, String bank, String lang) {
        // Danh sách dự phòng các trạm ATM thực tế tại TP.HCM (Quận 1 & Quận 5)
        List<PoiDto> base = List.of(
                PoiDto.builder().id("demo-1").name("ATM BIDV - Chi nhánh Hàm Nghi").type("ATM").bankName("BIDV").address("36 Hàm Nghi, Phường Bến Nghé, Quận 1").latitude(10.7708).longitude(106.7045).build(),
                PoiDto.builder().id("demo-2").name("ATM Vietcombank - Bến Thành").type("ATM").bankName("Vietcombank").address("68 Lê Lợi, Phường Bến Thành, Quận 1").latitude(10.7721).longitude(106.6983).build(),
                PoiDto.builder().id("demo-3").name("ATM Techcombank - Nguyễn Huệ").type("ATM").bankName("Techcombank").address("Phố đi bộ Nguyễn Huệ, Quận 1").latitude(10.7743).longitude(106.7032).build(),
                PoiDto.builder().id("demo-4").name("ATM Agribank - Chợ Lớn Quận 5").type("ATM").bankName("Agribank").address("126 Hồng Bàng, Phường 12, Quận 5").latitude(10.7554).longitude(106.6652).build(),
                PoiDto.builder().id("demo-5").name("ATM VietinBank - An Đông Quận 5").type("ATM").bankName("VietinBank").address("34 An Dương Vương, Phường 9, Quận 5").latitude(10.7582).longitude(106.6710).build(),
                PoiDto.builder().id("demo-6").name("ATM MB Bank - Trần Hưng Đạo").type("ATM").bankName("MB Bank").address("215 Trần Hưng Đạo, Quận 5").latitude(10.7540).longitude(106.6740).build(),
                PoiDto.builder().id("demo-7").name("ATM ACB - Nguyễn Trãi").type("ATM").bankName("ACB").address("450 Nguyễn Trãi, Phường 8, Quận 5").latitude(10.7530).longitude(106.6680).build(),
                PoiDto.builder().id("demo-8").name("ATM Sacombank - Hải Triều").type("ATM").bankName("Sacombank").address("2 Hải Triều, Phường Bến Nghé, Quận 1").latitude(10.7719).longitude(106.7051).build()
        );

        List<NearbyItemDto> filtered = new ArrayList<>();
        for (PoiDto p : base) {
            if (bank != null && !p.getBankName().toLowerCase().contains(bank.toLowerCase())) {
                continue;
            }
            long dist = calculateHaversine(lat, lng, p.getLatitude(), p.getLongitude());
            filtered.add(NearbyItemDto.builder()
                    .poi(p)
                    .distanceMeters(dist)
                    .narration(buildNarration(p, dist, lang))
                    .build());
        }

        filtered.sort(Comparator.comparingLong(NearbyItemDto::getDistanceMeters));
        return filtered;
    }

    public static long calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }
}
