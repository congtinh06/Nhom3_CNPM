package com.antiphishing.linkverification.service;

import com.antiphishing.linkverification.dto.VerifyRequest;
import com.antiphishing.linkverification.dto.VerifyResponse;

public interface VerificationService {
    VerifyResponse verify(VerifyRequest request);
}
