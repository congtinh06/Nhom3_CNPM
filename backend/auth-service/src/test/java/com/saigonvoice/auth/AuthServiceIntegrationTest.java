package com.saigonvoice.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saigonvoice.auth.service.MailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

/**
 * Kiểm thử end-to-end mọi endpoint auth với SQL Server thật (Testcontainers).
 * MailService được mock để bắt token xác thực/đặt lại mật khẩu mà không cần SMTP.
 * Mỗi test dùng một email riêng để không phụ thuộc thứ tự chạy.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@DisplayName("AuthService - tích hợp với SQL Server")
class AuthServiceIntegrationTest {

    @Container
    @ServiceConnection
    static final MSSQLServerContainer<?> MSSQL =
            new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest").acceptLicense();

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.secret", () -> "integration-test-secret-with-at-least-32-chars!");
        registry.add("app.refresh.cookie-secure", () -> "false");
        registry.add("app.security.frontend-url", () -> "http://localhost:5173");
        // Nới ngưỡng chống spam để các test độc lập không dẫm lên nhau;
        // chính sách rate-limit được kiểm chứng riêng ở RateLimitServiceTest.
        registry.add("app.rate-limit.register-per-hour", () -> "500");
        registry.add("app.rate-limit.forgot-per-hour", () -> "500");
    }

    /**
     * Dùng java.net.http.HttpClient thay vì HttpURLConnection (mặc định của RestTemplate):
     * HttpURLConnection ném HttpRetryException "cannot retry due to server authentication,
     * in streaming mode" với MỌI response 401 của request POST.
     */
    @LocalServerPort
    private int port;

    private RestTemplate rest;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MailService mailService;

    private final AtomicReference<String> lastVerificationToken = new AtomicReference<>();
    private final AtomicReference<String> lastResetToken = new AtomicReference<>();

    private static final String PASSWORD = "Str0ngPass!";

    @BeforeEach
    void setUp() {
        rest = new RestTemplate(new JdkClientHttpRequestFactory());
        // Không ném exception cho 4xx/5xx: test tự assert status code và body.
        rest.setErrorHandler(new ResponseErrorHandler() {
            @Override
            public boolean hasError(ClientHttpResponse response) {
                return false;
            }

            @Override
            public void handleError(ClientHttpResponse response) {
            }
        });
        lastVerificationToken.set(null);
        lastResetToken.set(null);
        doAnswer(inv -> {
            lastVerificationToken.set(inv.getArgument(1));
            return null;
        }).when(mailService).sendVerificationEmail(anyString(), anyString());

        doAnswer(inv -> {
            lastResetToken.set(inv.getArgument(1));
            return null;
        }).when(mailService).sendPasswordResetEmail(anyString(), anyString());
    }

    // ------------------------------------------------------------------ helper

    private String uniqueEmail(String tag) {
        return tag + "." + System.nanoTime() + "@saigonvoice.local";
    }

    private String registerBody(String email, String password) {
        return "{\"fullName\":\"Người dùng thử\",\"email\":\"%s\",\"password\":\"%s\",\"confirmPassword\":\"%s\"}"
                .formatted(email, password, password);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private ResponseEntity<String> post(String path, String body, HttpHeaders extra) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (extra != null) {
            extra.forEach((key, values) -> headers.addAll(key, values));
        }
        return rest.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    }

    private ResponseEntity<String> get(String path, String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        if (accessToken != null) {
            headers.setBearerAuth(accessToken);
        }
        return rest.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    private JsonNode json(ResponseEntity<String> response) throws Exception {
        return objectMapper.readTree(response.getBody());
    }

    private ResponseEntity<String> login(String email, String password) {
        return post("/api/auth/login",
                "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password), null);
    }

    private String extractRefreshCookie(ResponseEntity<String> response) {
        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("refresh_token=");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("SameSite=Strict");
        assertThat(setCookie).contains("Path=/api/auth");
        return setCookie.split("refresh_token=", 2)[1].split(";", 2)[0];
    }

    /** Đăng ký + xác thực email, trả về email đã dùng. */
    private String registerAndVerify(String tag) {
        String email = uniqueEmail(tag);
        ResponseEntity<String> registered = post("/api/auth/register", registerBody(email, PASSWORD), null);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        String token = lastVerificationToken.get();
        assertThat(token).isNotBlank();
        ResponseEntity<String> verified = post("/api/auth/verify-email",
                "{\"token\":\"" + token + "\"}", null);
        assertThat(verified.getStatusCode()).isEqualTo(HttpStatus.OK);
        return email;
    }

    private String accessTokenOf(String email) throws Exception {
        ResponseEntity<String> response = login(email, PASSWORD);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return json(response).get("accessToken").asText();
    }

    // ------------------------------------------------------------------- tests

    @Test
    @DisplayName("Đăng ký -> chưa xác thực thì không đăng nhập được -> xác thực -> đăng nhập -> /me")
    void registerVerifyLoginMe() throws Exception {
        String email = uniqueEmail("verify");

        ResponseEntity<String> registered = post("/api/auth/register", registerBody(email, PASSWORD), null);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registered.getBody()).contains("Đăng ký thành công");
        String verifyToken = lastVerificationToken.get();
        assertThat(verifyToken).isNotBlank();

        ResponseEntity<String> loginBeforeVerify = login(email, PASSWORD);
        assertThat(loginBeforeVerify.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(loginBeforeVerify.getBody()).contains("chưa được xác thực email");

        ResponseEntity<String> verified = post("/api/auth/verify-email",
                "{\"token\":\"" + verifyToken + "\"}", null);
        assertThat(verified.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> login = login(email, PASSWORD);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        String token = json(login).get("accessToken").asText();
        assertThat(token).isNotBlank();
        assertThat(extractRefreshCookie(login)).isNotBlank();

        ResponseEntity<String> me = get("/api/auth/me", token);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(me).get("email").asText()).isEqualTo(email);

        ResponseEntity<String> meNoToken = get("/api/auth/me", null);
        assertThat(meNoToken.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Sai mật khẩu trả 401 cùng một thông điệp, không lộ email có tồn tại hay không")
    void loginWrongPasswordReturnsGenericMessage() throws Exception {
        String email = registerAndVerify("wrong-pw");

        ResponseEntity<String> wrongPassword = login(email, "khong-dung");
        assertThat(wrongPassword.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(wrongPassword.getBody()).contains("Email hoặc mật khẩu không đúng.");

        ResponseEntity<String> unknownEmail = login(uniqueEmail("khong-ton-tai"), "khong-dung");
        assertThat(unknownEmail.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        // Cùng một thông điệp -> không phân biệt được email có tồn tại hay không
        // (chỉ khác timestamp nên so sánh riêng message)
        assertThat(json(unknownEmail).get("message").asText())
                .isEqualTo(json(wrongPassword).get("message").asText());
    }

    @Test
    @DisplayName("Refresh xoay vòng token: cookie cũ dùng lại lần thứ hai bị 401")
    void refreshRotatesAndOldCookieIsRejected() {
        String email = registerAndVerify("refresh");
        ResponseEntity<String> loginResponse = login(email, PASSWORD);
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String oldCookie = extractRefreshCookie(loginResponse);

        HttpHeaders withCookie = new HttpHeaders();
        withCookie.set(HttpHeaders.COOKIE, "refresh_token=" + oldCookie);

        ResponseEntity<String> refreshed = post("/api/auth/refresh", null, withCookie);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        String newCookie = extractRefreshCookie(refreshed);
        assertThat(newCookie).isNotBlank().isNotEqualTo(oldCookie);

        ResponseEntity<String> reuse = post("/api/auth/refresh", null, withCookie);
        assertThat(reuse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Đổi mật khẩu giữ nguyên phiên hiện tại, thu hồi các phiên khác")
    void changePasswordRevokesOtherSessions() throws Exception {
        String email = registerAndVerify("change-pw");

        // Hai phiên đăng nhập khác nhau (cookie A và cookie B)
        ResponseEntity<String> loginA = login(email, PASSWORD);
        String cookieA = extractRefreshCookie(loginA);
        String bearerA = json(loginA).get("accessToken").asText();
        ResponseEntity<String> loginB = login(email, PASSWORD);
        String cookieB = extractRefreshCookie(loginB);

        HttpHeaders withA = new HttpHeaders();
        withA.setBearerAuth(bearerA);
        withA.set(HttpHeaders.COOKIE, "refresh_token=" + cookieA);

        ResponseEntity<String> changed = post("/api/auth/change-password",
                "{\"oldPassword\":\"%s\",\"newPassword\":\"N0vaPass!\",\"confirmPassword\":\"N0vaPass!\"}"
                        .formatted(PASSWORD), withA);
        assertThat(changed.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Phiên đang thao tác vẫn hoạt động
        HttpHeaders cookieOnlyA = new HttpHeaders();
        cookieOnlyA.set(HttpHeaders.COOKIE, "refresh_token=" + cookieA);
        ResponseEntity<String> refreshA = post("/api/auth/refresh", null, cookieOnlyA);
        assertThat(refreshA.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Phiên khác bị thu hồi
        HttpHeaders cookieOnlyB = new HttpHeaders();
        cookieOnlyB.set(HttpHeaders.COOKIE, "refresh_token=" + cookieB);
        ResponseEntity<String> refreshB = post("/api/auth/refresh", null, cookieOnlyB);
        assertThat(refreshB.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // Mật khẩu cũ không dùng lại được, mật khẩu mới thì được
        ResponseEntity<String> loginOld = login(email, PASSWORD);
        assertThat(loginOld.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        ResponseEntity<String> loginNew = login(email, "N0vaPass!");
        assertThat(loginNew.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Quên mật khẩu luôn trả 200 dù email có tồn tại hay không")
    void forgotPasswordAlwaysReturns200() {
        String email = registerAndVerify("forgot");

        ResponseEntity<String> unknown = post("/api/auth/forgot-password",
                "{\"email\":\"" + uniqueEmail("khong-ton-tai") + "\"}", null);
        assertThat(unknown.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(lastResetToken.get()).isNull();

        ResponseEntity<String> known = post("/api/auth/forgot-password",
                "{\"email\":\"%s\"}".formatted(email), null);
        assertThat(known.getStatusCode()).isEqualTo(HttpStatus.OK);
        String resetToken = lastResetToken.get();
        assertThat(resetToken).isNotBlank();

        ResponseEntity<String> reset = post("/api/auth/reset-password",
                "{\"token\":\"" + resetToken + "\",\"newPassword\":\"N0vaPass!\",\"confirmPassword\":\"N0vaPass!\"}",
                null);
        assertThat(reset.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> reuseToken = post("/api/auth/reset-password",
                "{\"token\":\"" + resetToken + "\",\"newPassword\":\"Khac1234!\",\"confirmPassword\":\"Khac1234!\"}",
                null);
        assertThat(reuseToken.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND);

        ResponseEntity<String> badToken = post("/api/auth/reset-password",
                "{\"token\":\"" + "a".repeat(64) + "\",\"newPassword\":\"N0vaPass!\",\"confirmPassword\":\"N0vaPass!\"}",
                null);
        assertThat(badToken.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Email đã dùng khi đăng ký lại trả 409 Conflict")
    void registerDuplicateEmailReturnsConflict() {
        String email = uniqueEmail("dup");

        ResponseEntity<String> first = post("/api/auth/register", registerBody(email, PASSWORD), null);
        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> second = post("/api/auth/register", registerBody(email, PASSWORD), null);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Người dùng thường không gọi được /api/auth/admin/users")
    void adminEndpointRejectsRegularUser() throws Exception {
        String email = registerAndVerify("no-admin");
        ResponseEntity<String> response = get("/api/auth/admin/users", accessTokenOf(email));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Logout trả 204 và xóa cookie")
    void logoutReturns204AndClearsCookie() {
        ResponseEntity<String> logout = post("/api/auth/logout", null, null);
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(logout.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");
    }

    @Test
    @DisplayName("Mật khẩu yếu bị chặn ở tầng validation với lỗi theo ô")
    void registerRejectsWeakPassword() {
        ResponseEntity<String> response = post("/api/auth/register",
                registerBody(uniqueEmail("weak"), "abcdefgh"), null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("password");
    }
}
