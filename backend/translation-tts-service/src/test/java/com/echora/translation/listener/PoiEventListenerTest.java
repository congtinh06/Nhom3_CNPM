package com.echora.translation.listener;

import com.echora.translation.event.PoiEventPayload;
import com.echora.translation.service.PoiPipelineService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.*;

class PoiEventListenerTest {

    @Test
    @DisplayName("Should delegate incoming POI event to pipeline service")
    void testOnPoiEvent_delegatesToPipelineService() {
        PoiPipelineService pipelineService = mock(PoiPipelineService.class);
        PoiEventListener listener = new PoiEventListener(pipelineService);

        PoiEventPayload payload = PoiEventPayload.builder()
                .poiId(101L)
                .title("Title")
                .description("Description")
                .targetLanguages(List.of("en"))
                .build();

        listener.onPoiEvent(payload);

        verify(pipelineService, times(1)).processPoiEvent(payload);
    }
}
