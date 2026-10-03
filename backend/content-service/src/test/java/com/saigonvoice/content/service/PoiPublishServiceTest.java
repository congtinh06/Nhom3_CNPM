package com.saigonvoice.content.service;

import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.entity.PublishStatus;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.event.PoiCreatedEvent;
import com.saigonvoice.content.messaging.EventPublishException;
import com.saigonvoice.content.messaging.PoiEventPublisher;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PoiPublishServiceTest {

    @Mock private PoiRepository poiRepository;
    @Mock private PoiTranslationRepository translationRepository;
    @Mock private PoiEventPublisher eventPublisher;

    private PoiPublishService service;
    private Poi poi;

    @BeforeEach
    void setUp() {
        service = new PoiPublishService(poiRepository, translationRepository, eventPublisher, 3);
        poi = Poi.builder().id(1L).code("POI_1").zone(Zone.builder().id(9L).build())
                .publishStatus(PublishStatus.PENDING).publishAttempts(0).build();
        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi));
        lenient().when(translationRepository.findByPoiIdAndLanguageCode(1L, "vi")).thenReturn(Optional.of(
                PoiTranslation.builder().languageCode("vi").title("T").summary("S").description("D").build()));
    }

    @Test
    @DisplayName("broker ACK + routed -> PUBLISHED")
    void success() {
        String status = service.publishPoiCreated(1L);

        assertThat(status).isEqualTo(PublishStatus.PUBLISHED);
        assertThat(poi.getPublishAttempts()).isEqualTo(1);
        assertThat(poi.getLastPublishError()).isNull();
        verify(eventPublisher).publish(eq("poi.created"), any(PoiCreatedEvent.class));
        verify(poiRepository).save(poi);
    }

    @Test
    @DisplayName("publish error -> stays PENDING with error recorded (not swallowed silently)")
    void failureKeepsPending() {
        doThrow(new EventPublishException("Unroutable message")).when(eventPublisher).publish(any(), any());

        String status = service.publishPoiCreated(1L);

        assertThat(status).isEqualTo(PublishStatus.PENDING);
        assertThat(poi.getPublishAttempts()).isEqualTo(1);
        assertThat(poi.getLastPublishError()).contains("Unroutable");
        assertThat(poi.getLastPublishAttemptAt()).isNotNull();
        verify(poiRepository).save(poi);
    }

    @Test
    @DisplayName("publish error at max attempts -> FAILED")
    void failureAtMaxAttemptsBecomesFailed() {
        poi.setPublishAttempts(2);
        doThrow(new EventPublishException("Broker NACK")).when(eventPublisher).publish(any(), any());

        String status = service.publishPoiCreated(1L);

        assertThat(status).isEqualTo(PublishStatus.FAILED);
        assertThat(poi.getPublishAttempts()).isEqualTo(3);
    }

    @Test
    @DisplayName("republish resets counter of a FAILED POI and sends again")
    void republishResets() {
        poi.setPublishStatus(PublishStatus.FAILED);
        poi.setPublishAttempts(3);

        String status = service.republish(1L);

        assertThat(status).isEqualTo(PublishStatus.PUBLISHED);
        assertThat(poi.getPublishAttempts()).isEqualTo(1);
    }

    @Test
    @DisplayName("already PUBLISHED -> not sent twice by retry job")
    void alreadyPublishedIsSkipped() {
        poi.setPublishStatus(PublishStatus.PUBLISHED);

        service.publishPoiCreated(1L);

        verifyNoInteractions(eventPublisher);
        verify(poiRepository, never()).save(any());
    }
}
