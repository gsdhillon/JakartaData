package com.gurmeet.modules.security;

import com.gurmeet.modules.person.Person;
import com.gurmeet.modules.person.PersonService;
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
import java.time.Instant;
import java.util.Base64;

@ApplicationScoped
public class SecurityService {

    private static final long TOKEN_TTL_SECONDS = 8 * 60 * 60;
    private static final String JWT_ALGORITHM = "HmacSHA256";
    private static final String JWT_SECRET = "JakartaDataPersonChangeThisSecret";

    private PersonService personService;
    private PasswordService passwordService;

    public SecurityService() {
    }

    @Inject
    public SecurityService(PersonService personService, PasswordService passwordService) {
        this.personService = personService;
        this.passwordService = passwordService;
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getPersonId() == null) {
            throw new BadRequestException("Person id is required.");
        }

        Person person = personService.findById(request.getPersonId())
                .orElseThrow(() -> new NotAuthorizedException("Invalid login."));

        if (!passwordService.verifyPassword(request.getPassword(), person.getPassword())) {
            throw new NotAuthorizedException("Invalid login.");
        }

        if (passwordService.needsPasswordUpgrade(person.getPassword())) {
            personService.changePassword(person.getId(), passwordService.hashPassword(request.getPassword()));
        }

        return new AuthResponse(person, createToken(person));
    }

    public void changePassword(String authorizationHeader, ChangePasswordRequest request) {
        Long personId = requireUserId(authorizationHeader);
        Person person = personService.findById(personId)
                .orElseThrow(() -> new NotAuthorizedException("Invalid token."));

        if (!passwordService.verifyPassword(request.getCurrentPassword(), person.getPassword())) {
            throw new NotAuthorizedException("Current password is not valid.");
        }

        personService.changePassword(personId, passwordService.hashPassword(request.getNewPassword()));
    }

    public Long requireUserId(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);

        if (token == null || token.isBlank()) {
            throw new NotAuthorizedException("Bearer token is required.");
        }

        JsonObject payload = verifyToken(token);
        long expiresAt = payload.getJsonNumber("exp").longValue();

        if (Instant.now().getEpochSecond() >= expiresAt) {
            throw new NotAuthorizedException("Token expired.");
        }

        return payload.getJsonNumber("sub").longValue();
    }

    public Person requirePerson(String authorizationHeader) {
        Long personId = requireUserId(authorizationHeader);

        return personService.findById(personId)
                .orElseThrow(() -> new NotAuthorizedException("Invalid token."));
    }

    private String createToken(Person person) {
        long expiresAt = Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS;
        String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payload = "{\"sub\":" + person.getId() + ",\"name\":\"" + escapeJson(person.getName()) + "\",\"role\":\"" + escapeJson(person.getRole()) + "\",\"exp\":" + expiresAt + "}";
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
}
