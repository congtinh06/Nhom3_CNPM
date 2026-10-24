package com.echora.translation.service;

import com.echora.translation.event.PoiEventPayload;

public interface PoiPipelineService {

    /**
     * Processes an incoming POI event for all target languages and Vietnamese source.
     *
     * @param event the POI event payload
     */
    void processPoiEvent(PoiEventPayload event);
}
