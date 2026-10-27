package com.echora.auth.entity;

public enum QrLoginStatus {
    PENDING,
    SCANNED,
    APPROVED,
    GUEST_APPROVED,
    DENIED,
    CONSUMED,
    EXPIRED,
    CANCELLED
}
