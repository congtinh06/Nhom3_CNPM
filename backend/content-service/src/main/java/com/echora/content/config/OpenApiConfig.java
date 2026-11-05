package com.echora.content.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI(
            @Value("${info.app.version:1.0.0}") String version,
            @Value("${GATEWAY_URL:http://localhost:18080}") String gatewayUrl) {
        return new OpenAPI()
                .info(new Info()
                        .title("Echora Content Service")
                        .version(version)
                        .description("Quản lý dữ liệu POI, danh mục văn hóa, lộ trình tham quan và kịch bản audio."))
                .servers(List.of(new Server().url(gatewayUrl).description("API Gateway")));
    }
}
