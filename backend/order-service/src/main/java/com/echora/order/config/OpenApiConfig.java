package com.echora.order.config;

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
                        .title("Echora Order Service")
                        .version(version)
                        .description("Xử lý đơn hàng, thanh toán gói tham quan và quyền truy cập nội dung trả phí."))
                .servers(List.of(new Server().url(gatewayUrl).description("API Gateway")));
    }
}
