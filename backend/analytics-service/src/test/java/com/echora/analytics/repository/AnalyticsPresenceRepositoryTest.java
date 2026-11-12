package com.echora.analytics.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsPresenceRepositoryTest {

    @Test
    @DisplayName("MERGE upsertPresence sử dụng hint WITH (HOLDLOCK) trên bảng đích")
    void upsertPresence_MergeUsesHoldlockHint() throws NoSuchMethodException {
        Method method = AnalyticsPresenceRepository.class.getDeclaredMethod(
                "upsertPresence",
                String.class,
                LocalDateTime.class,
                String.class,
                String.class
        );
        Query query = method.getAnnotation(Query.class);

        assertThat(query).isNotNull();
        assertThat(query.nativeQuery()).isTrue();
        assertThat(query.value()).contains("MERGE dbo.analytics_presence WITH (HOLDLOCK) AS target");
    }
}

