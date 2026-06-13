package com.grove.core.security;

import com.grove.core.notifications.NotificationService;
import com.grove.core.security.login.ChangePasswordRequest;
import com.grove.core.security.login.LoginRequest;
import com.grove.core.user_logs.UserLogService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@ApplicationScoped
public class SecurityService {

    private static final long TOKEN_TTL_SECONDS = 8 * 60 * 60;
    private static final String JWT_ALGORITHM = "HmacSHA256";
    private static final String JWT_SECRET = "JakartaDataPersonChangeThisSecret";

    private AuthUserStore authUserStore;
    private NotificationService notificationService;
    private PasswordService passwordService;
    private UserLogService userLogService;

    public SecurityService() {
    }

    @Inject
    public SecurityService(
            AuthUserStore authUserStore,
            NotificationService notificationService,
            PasswordService passwordService,
            UserLogService userLogService
    ) {
        this.authUserStore = authUserStore;
        this.notificationService = notificationService;
        this.passwordService = passwordService;
        this.userLogService = userLogService;
    }

    public AuthResponse login(LoginRequest request, String ip) {
        String loginId = clean(request.getLoginId());

        if (loginId == null) {
            throw new BadRequestException("Login ID is required.");
        }

        AuthUser user = authUserStore.findByLoginId(loginId)
                .orElseThrow(() -> new NotAuthorizedException("Invalid login."));

        if (!passwordService.verifyPassword(request.getPassword(), user.getPassword())) {
            throw new NotAuthorizedException("Invalid login.");
        }

        user.setLoginId(loginId);

        if (passwordService.needsPasswordUpgrade(user.getPassword())) {
            authUserStore.changePassword(user.getId(), passwordService.hashPassword(request.getPassword()));
            user.setPasswordChangeRequired(false);
        }

        String sessionId = userLogService.recordLogin(user, ip);

        return new AuthResponse(user, createToken(user, sessionId), sessionId);
    }

    public void logout(String authorizationHeader) {
        optionalSessionId(authorizationHeader).ifPresent(userLogService::recordLogout);
    }

    public void changePassword(String authorizationHeader, ChangePasswordRequest request) {
        String userId = requireUserId(authorizationHeader);
        AuthUser user = authUserStore.findById(userId)
                .orElseThrow(() -> new NotAuthorizedException("Invalid token."));

        if (!passwordService.verifyPassword(request.getCurrentPassword(), user.getPassword())) {
            throw new NotAuthorizedException("Current password is not valid.");
        }

        authUserStore.changePassword(userId, passwordService.hashPassword(request.getNewPassword()));
        notificationService.notifyUser(
                userId,
                "Password changed",
                "Your password has been changed at " + currentDateTime(),
                "security"
        );
    }

    public String requireUserId(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);

        if (token == null || token.isBlank()) {
            throw new NotAuthorizedException("Bearer token is required.");
        }

        JsonObject payload = verifyToken(token);
        long expiresAt = payload.getJsonNumber("exp").longValue();

        if (Instant.now().getEpochSecond() >= expiresAt) {
            throw new NotAuthorizedException("Token expired.");
        }

        return payload.getString("sub");
    }

    public AuthUser requireUser(String authorizationHeader) {
        String userId = requireUserId(authorizationHeader);

        return authUserStore.findById(userId)
                .orElseThrow(() -> new NotAuthorizedException("Invalid token."));
    }

    public Optional<String> optionalSessionId(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);

        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        try {
            JsonObject payload = verifyToken(token);

            return payload.containsKey("sessionId")
                    ? Optional.of(payload.getString("sessionId"))
                    : Optional.empty();
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private String createToken(AuthUser user, String sessionId) {
        long expiresAt = Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS;
        String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payload = "{"
                + "\"sub\":\"" + escapeJson(user.getId()) + "\","
                + "\"sessionId\":\"" + escapeJson(sessionId) + "\","
                + "\"loginId\":\"" + escapeJson(user.getLoginId()) + "\","
                + "\"name\":\"" + escapeJson(user.getName()) + "\","
                + "\"role\":\"" + escapeJson(user.getRole()) + "\","
                + "\"email\":\"" + escapeJson(user.getEmail()) + "\","
                + "\"mobileNo\":\"" + escapeJson(user.getMobileNo()) + "\","
                + "\"exp\":" + expiresAt
                + "}";
        String unsignedToken = base64Url(header.getBytes(StandardCharsets.UTF_8)) + "." + base64Url(payload.getBytes(StandardCharsets.UTF_8));

        return unsignedToken + "." + sign(unsignedToken);
    }

    private JsonObject verifyToken(String token) {
        String[] parts = token.split("\\.");

        if (parts.length != 3) {
            throw new NotAuthorizedException("Invalid token.");
        }

        String unsignedToken = parts[0] + "." + parts[1];
        String expectedSignature = sign(unsignedToken);

        if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new NotAuthorizedException("Invalid token.");
        }

        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);

        return Json.createReader(new StringReader(payloadJson)).readObject();
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(JWT_ALGORITHM);
            mac.init(new SecretKeySpec(JWT_SECRET.getBytes(StandardCharsets.UTF_8), JWT_ALGORITHM));
            return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign JWT.", exception);
        }
    }

    private String bearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }

        return authorizationHeader.substring(7).trim();
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String escapeJson(String value) {
        return String.valueOf(value == null ? "" : value).replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String clean(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }

    private String currentDateTime() {
        return ZonedDateTime.now(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm:ss z"));
    }
}
