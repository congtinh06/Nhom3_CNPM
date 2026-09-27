package com.antiphishing.narration.service;

import com.antiphishing.narration.dto.NarrationRequest;
import com.antiphishing.narration.dto.NarrationResponse;

public interface NarrationService {

    NarrationResponse narrate(NarrationRequest request);
}
