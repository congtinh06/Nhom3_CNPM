package com.echora.auth.service;

import java.time.LocalDateTime;

public interface UserSeedService {
    boolean adminExists(String email);
    boolean migrateLegacyAdmin(String legacyEmail, String newEmail);
    void createAdmin(String email, String encodedPassword);
    boolean userExists(String email);
    void createTestUser(String email, String encodedPassword);
    void upsertDemoPremiumUser(String email, String encodedPassword, LocalDateTime expiresAt);
}

