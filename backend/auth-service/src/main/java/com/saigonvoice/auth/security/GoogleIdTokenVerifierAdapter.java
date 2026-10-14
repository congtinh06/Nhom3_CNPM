package com.saigonvoice.auth.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.saigonvoice.auth.exception.BadRequestException;
import com.saigonvoice.auth.exception.ServiceUnavailableException;
import com.saigonvoice.auth.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Locale;

/**
 * Xác minh Google ID token bằng thư viện chính thức {@code google-api-client}.
 *
 * <p>Thư viện kiểm tra: chữ ký RS256 (bộ khóa công khai của Google), issuer
 * ({@code accounts.google.com} hoặc {@code https://accounts.google.com}), audience
 * khớp {@code GOOGLE_CLIENT_ID}, và thời hạn (issued-at/expiry, cho phép lệch 5 phút).
 * Ngoài ra adapter bắt buộc {@code email_verified} là true.</p>
 *
 * <p>Khi {@code GOOGLE_CLIENT_ID} trống, ứng dụng vẫn khởi động bình thường; chỉ khi
 * gọi endpoint mới trả 503. Không có client secret ở bất kỳ đâu, và token không bao
 * giờ bị ghi log.</p>
 */
@Component
@Slf4j
public class GoogleIdTokenVerifierAdapter implements GoogleTokenVerifier {

    private static final int MAX_CREDENTIAL_LENGTH = 8192;
    private static final String GENERIC_ERROR = "Không thể xác minh tài khoản Google.";
    private static final String NOT_CONFIGURED = "Đăng nhập Google chưa được cấu hình.";

    private final String clientId;
    private volatile GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierAdapter(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    @Override
    public GoogleIdentity verify(String credential) {
        if (clientId.isEmpty()) {
            log.warn("Yêu cầu đăng nhập Google nhưng GOOGLE_CLIENT_ID chưa được cấu hình.");
            throw new ServiceUnavailableException(NOT_CONFIGURED);
        }
        if (credential == null || credential.isBlank()) {
            throw new BadRequestException("Thiếu thông tin đăng nhập Google.");
        }
        if (credential.length() > MAX_CREDENTIAL_LENGTH) {
            throw new BadRequestException("Thông tin đăng nhập Google không hợp lệ.");
        }

        try {
            GoogleIdToken idToken = verifier().verify(credential);
            if (idToken == null) {
                throw new UnauthorizedException(GENERIC_ERROR);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            Boolean emailVerified = payload.getEmailVerified();
            String subject = payload.getSubject();
            String email = payload.getEmail();

            if (emailVerified == null || !emailVerified
                    || subject == null || subject.isBlank()
                    || email == null || email.isBlank()) {
                throw new UnauthorizedException(GENERIC_ERROR);
            }

            Object nameClaim = payload.get("name");
            String name = nameClaim instanceof String value ? value : null;
            return new GoogleIdentity(subject, email.trim().toLowerCase(Locale.ROOT), true, name);
        } catch (UnauthorizedException | BadRequestException | ServiceUnavailableException ex) {
            throw ex;
        } catch (GeneralSecurityException | IOException ex) {
            // Không log token/credential — chỉ log loại lỗi.
            log.warn("Xác minh Google ID token thất bại: {}", ex.getClass().getSimpleName());
            throw new UnauthorizedException(GENERIC_ERROR);
        } catch (RuntimeException ex) {
            // Token sai định dạng có thể ném IllegalArgumentException từ thư viện.
            log.warn("Google ID token sai định dạng: {}", ex.getClass().getSimpleName());
            throw new UnauthorizedException(GENERIC_ERROR);
        }
    }

    /** Khởi tạo verifier lười (lazy) để bean tạo được ngay cả khi chưa cấu hình Client ID. */
    private GoogleIdTokenVerifier verifier() {
        GoogleIdTokenVerifier current = verifier;
        if (current == null) {
            synchronized (this) {
                current = verifier;
                if (current == null) {
                    current = new GoogleIdTokenVerifier.Builder(
                            new NetHttpTransport(), GsonFactory.getDefaultInstance())
                            .setAudience(Collections.singletonList(clientId))
                            .build();
                    verifier = current;
                }
            }
        }
        return current;
    }
}
