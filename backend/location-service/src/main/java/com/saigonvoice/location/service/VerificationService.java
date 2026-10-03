package com.saigonvoice.location.service;

import com.saigonvoice.location.dto.VerifyRequest;
import com.saigonvoice.location.dto.VerifyResponse;

public interface VerificationService {
    VerifyResponse verify(VerifyRequest request);
}
