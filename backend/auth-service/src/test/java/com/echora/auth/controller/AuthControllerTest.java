package com.echora.auth.controller;

import com.echora.auth.dto.AuthResponse;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.GoogleLoginRequest;
import com.echora.auth.dto.LoginRequest;
import com.echora.auth.dto.MessageResponse;
import com.echora.auth.dto.RegisterRequest;
import com.echora.auth.dto.UserResponse;
import com.echora.auth.exception.GlobalExceptionHandler;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Duration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private final AuthService authService = mock(AuthService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AuthController controller = new AuthController(authService);
        ReflectionTestUtils.setField(controller, "refreshCookieName", "refresh_token");
        ReflectionTestUtils.setField(controller, "adminRefreshCookieName", "refresh_token_admin");
        ReflectionTestUtils.setField(controller, "refreshCookiePath", "/api/auth");
        ReflectionTestUtils.setField(controller, "refreshCookieSecure", true);
        ReflectionTestUtils.setField(controller, "refreshCookieSameSite", "Strict");

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private String registerBody(String email, String password, String confirm) {
        return """
                {"fullName":"Nguyễn Văn A","email":"%s","password":"%s","confirmPassword":"%s"}
                """.formatted(email, password, confirm);
    }

    @Test
    @DisplayName("POST /api/auth/register hợp lệ trả 201")
    void registerReturnsCreated() throws Exception {
        when(authService.register(any(RegisterRequest.class), anyString(), any()))
                .thenReturn(new MessageResponse("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("a@echora.local", "Abcdefg1", "Abcdefg1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Đăng ký thành công")));
    }

    @Test
    @DisplayName("Email sai định dạng trả 400 kèm lỗi theo ô")
    void registerInvalidEmailReturnsFieldError() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("khong-phai-email", "Abcdefg1", "Abcdefg1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.email").exists());
    }

    @Test
    @DisplayName("Mật khẩu không đủ độ mạnh trả 400 kèm lỗi ô password")
    void registerWeakPasswordReturnsFieldError() throws Exception {
        when(authService.register(any(RegisterRequest.class), anyString(), any()))
                .thenThrow(new com.echora.auth.exception.FieldValidationException(
                        java.util.Map.of("password", "Mật khẩu phải có ít nhất một chữ số (0-9).")));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("a@echora.local", "abcdefgh", "abcdefgh")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.password").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login gắn cookie HttpOnly + Secure + SameSite=Strict + Path=/api/auth")
    void loginSetsHardenedRefreshCookie() throws Exception {
        UserResponse user = UserResponse.builder()
                .id(1L).fullName("Nguyễn Văn A").email("a@echora.local")
                .role("USER").emailVerified(true).build();
        when(authService.login(any(LoginRequest.class), anyString(), any()))
                .thenReturn(new CookieResult("raw-refresh", Duration.ofDays(7),
                        AuthResponse.builder().accessToken("jwt").expiresIn(900L)
                                .tokenType("Bearer").user(user).build()));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@echora.local\",\"password\":\"Secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(cookie().secure("refresh_token", true))
                .andExpect(cookie().path("refresh_token", "/api/auth"))
                .andExpect(cookie().sameSite("refresh_token", "Strict"))
                .andExpect(cookie().value("refresh_token", "raw-refresh"));
    }

    @Test
    @DisplayName("POST /api/auth/login với X-Auth-Scope=admin gắn cookie refresh admin riêng")
    void adminLoginSetsSeparateRefreshCookie() throws Exception {
        UserResponse user = UserResponse.builder()
                .id(9L).fullName("Quản trị").email("admin@echora.local")
                .role("ADMIN").emailVerified(true).build();
        when(authService.login(any(LoginRequest.class), anyString(), any()))
                .thenReturn(new CookieResult("raw-admin", Duration.ofDays(7),
                        AuthResponse.builder().accessToken("jwt-admin").expiresIn(900L)
                                .tokenType("Bearer").user(user).build()));

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Auth-Scope", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@echora.local\",\"password\":\"Secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token_admin", true))
                .andExpect(cookie().value("refresh_token_admin", "raw-admin"))
                .andExpect(cookie().doesNotExist("refresh_token"));
    }

    @Test
    @DisplayName("Đăng nhập sai trả 401 với thông điệp chung từ server")
    void loginFailureReturnsGenericMessage() throws Exception {
        when(authService.login(any(LoginRequest.class), anyString(), any()))
                .thenThrow(new UnauthorizedException("Email hoặc mật khẩu không đúng."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@echora.local\",\"password\":\"sai\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không đúng."));
    }

    @Test
    @DisplayName("POST /api/auth/google hợp lệ trả 200 kèm cookie refresh")
    void googleLoginReturnsTokenAndCookie() throws Exception {
        UserResponse user = UserResponse.builder()
                .id(2L).fullName("Khách Google").email("g@echora.local")
                .role("USER").emailVerified(true).build();
        when(authService.loginWithGoogle(any(GoogleLoginRequest.class), anyString(), any()))
                .thenReturn(new CookieResult("raw-google", Duration.ofDays(7),
                        AuthResponse.builder().accessToken("jwt-google").expiresIn(900L)
                                .tokenType("Bearer").user(user).build()));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"fake-google-id-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-google"))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(cookie().value("refresh_token", "raw-google"));
    }

    @Test
    @DisplayName("POST /api/auth/google thiếu credential trả 400 kèm lỗi ô credential")
    void googleLoginMissingCredentialReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.credential").exists());
    }

    @Test
    @DisplayName("POST /api/auth/google khi chưa cấu hình trả 503 kèm thông điệp tiếng Việt")
    void googleLoginNotConfiguredReturns503() throws Exception {
        when(authService.loginWithGoogle(any(GoogleLoginRequest.class), anyString(), any()))
                .thenThrow(new com.echora.auth.exception.ServiceUnavailableException(
                        "Đăng nhập Google chưa được cấu hình."));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\":\"fake-google-id-token\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Đăng nhập Google chưa được cấu hình."));
    }

    @Test
    @DisplayName("POST /api/auth/logout xóa cookie (Max-Age=0)")
    void logoutClearsCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")))
                .andExpect(cookie().value("refresh_token", ""));

        verify(authService).logout(null);
    }

    @Test
    @DisplayName("GET /api/auth/me khi chưa đăng nhập trả 401")
    void meWithoutAuthenticationReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/auth/refresh khi không có cookie trả 401")
    void refreshWithoutCookieReturns401() throws Exception {
        when(authService.refresh(eq(null), anyString(), any()))
                .thenThrow(new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn."));

        mockMvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }
}
