package com.echora.analytics.config;

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
                        .title("Echora Analytics Service")
                        .version(version)
                        .description("Thu thập sự kiện hành vi du khách và thống kê tương tác mã QR."))
                .servers(List.of(new Server().url(gatewayUrl).description("API Gateway")));
    }
}
