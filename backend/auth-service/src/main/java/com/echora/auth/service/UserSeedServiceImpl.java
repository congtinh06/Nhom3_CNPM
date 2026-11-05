package com.echora.auth.service;

import com.echora.auth.entity.User;
import com.echora.auth.entity.UserPlan;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserSeedServiceImpl implements UserSeedService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean adminExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    @Override
    @Transactional
    public boolean migrateLegacyAdmin(String legacyEmail, String newEmail) {
        User legacyAdmin = userRepository.findByEmail(legacyEmail).orElse(null);
        if (legacyAdmin != null) {
            legacyAdmin.setEmail(newEmail);
            legacyAdmin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(legacyAdmin);
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public void createAdmin(String email, String encodedPassword) {
        LocalDateTime now = LocalDateTime.now();
        User admin = User.builder()
                .fullName("Quản trị viên")
                .email(email)
                .passwordHash(encodedPassword)
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(admin);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean userExists(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional
    public void createTestUser(String email, String encodedPassword) {
        LocalDateTime now = LocalDateTime.now();
        User testUser = User.builder()
                .fullName("Nguyễn Văn Du Khách")
                .email(email)
                .passwordHash(encodedPassword)
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(testUser);
    }

    @Override
    @Transactional
    public void upsertDemoPremiumUser(String email, String encodedPassword, LocalDateTime expiresAt) {
        LocalDateTime now = LocalDateTime.now();
        User demo = userRepository.findByEmail(email).orElse(null);
        if (demo == null) {
            demo = User.builder()
                    .fullName("Khách Demo Premium")
                    .email(email)
                    .passwordHash(encodedPassword)
                    .role(UserRole.USER)
                    .status(UserStatus.ACTIVE)
                    .emailVerifiedAt(now)
                    .plan(UserPlan.PREMIUM)
                    .premiumExpiresAt(expiresAt)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        } else {
            demo.setFullName("Khách Demo Premium");
            demo.setRole(UserRole.USER);
            demo.setStatus(UserStatus.ACTIVE);
            demo.setEmailVerifiedAt(demo.getEmailVerifiedAt() != null ? demo.getEmailVerifiedAt() : now);
            demo.setPlan(UserPlan.PREMIUM);
            demo.setPremiumExpiresAt(expiresAt);
            demo.setUpdatedAt(now);
        }
        userRepository.save(demo);
    }
}

