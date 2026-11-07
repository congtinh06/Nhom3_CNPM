package com.echora.order.controller;

import com.echora.order.config.OpenApiConfig;
import com.echora.order.exception.GlobalExceptionHandler;
import com.echora.order.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springdoc.core.configuration.SpringDocConfiguration;
import org.springdoc.core.properties.SpringDocConfigProperties;
import org.springdoc.webmvc.core.configuration.SpringDocWebMvcConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OpenApiDocsTest {

    @Nested
    @WebMvcTest(controllers = OrderController.class)
    @Import({
            GlobalExceptionHandler.class,
            OpenApiConfig.class,
            SpringDocConfiguration.class,
            SpringDocConfigProperties.class,
            SpringDocWebMvcConfiguration.class,
            JacksonAutoConfiguration.class,
            com.echora.order.support.ClientIpResolver.class
    })
    @TestPropertySource(properties = {
            "springdoc.api-docs.enabled=true",
            "ECHORA_DOCS_ENABLED=true",
            "info.app.version=1.0.0"
    })
    @DisplayName("Khi ECHORA_DOCS_ENABLED=true: GET /v3/api-docs trả về 200, đúng Info và không có path nội bộ")
    class EnabledDocsTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private OrderService orderService;

        @Test
        @DisplayName("GET /v3/api-docs -> 200, tiêu đề Echora Order Service, version 1.0.0, không chứa /internal")
        void docsReturns200WithCorrectInfoAndNoInternalPaths() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.openapi").exists())
                    .andExpect(jsonPath("$.info.title").value("Echora Order Service"))
                    .andExpect(jsonPath("$.info.version").value("1.0.0"))
                    .andExpect(jsonPath("$.paths").exists())
                    .andExpect(jsonPath("$.paths['*internal*']").doesNotExist());
        }
    }

    @Nested
    @WebMvcTest(controllers = OrderController.class)
    @Import({GlobalExceptionHandler.class, com.echora.order.support.ClientIpResolver.class})
    @TestPropertySource(properties = {
            "springdoc.api-docs.enabled=false",
            "ECHORA_DOCS_ENABLED=false"
    })
    @DisplayName("Khi ECHORA_DOCS_ENABLED=false: GET /v3/api-docs trả về 404 ProblemDetail")
    class DisabledDocsTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private OrderService orderService;

        @Test
        @DisplayName("GET /v3/api-docs -> 404 với ProblemDetail schema")
        void docsReturns404ProblemDetail() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.title").value("Not Found"))
                    .andExpect(jsonPath("$.type").exists())
                    .andExpect(jsonPath("$.instance").value("/v3/api-docs"));
        }
    }
}
