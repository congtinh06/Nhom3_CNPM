package com.saigonvoice.translation.service;

import com.saigonvoice.translation.event.PoiEventPayload;

public interface PoiPipelineService {

    /**
     * Processes an incoming POI event for all target languages and Vietnamese source.
     *
     * @param event the POI event payload
     */
    void processPoiEvent(PoiEventPayload event);
}
