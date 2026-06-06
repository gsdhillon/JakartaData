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
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@ApplicationScoped
public class SecurityService {

    private static final String HASH_ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int HASH_ITERATIONS = 65536;
    private static final int HASH_LENGTH = 256;
    private static final long TOKEN_TTL_SECONDS = 8 * 60 * 60;
    private static final String JWT_ALGORITHM = "HmacSHA256";
    private static final String JWT_SECRET = "JakartaDataPersonChangeThisSecret";

    private final SecureRandom secureRandom = new SecureRandom();
    private PersonService personService;

    public SecurityService() {
    }

    @Inject
    public SecurityService(PersonService personService) {
        this.personService = personService;
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getPersonId() == null) {
            throw new BadRequestException("Person id is required.");
        }

        Person person = personService.findById(request.getPersonId())
                .orElseThrow(() -> new NotAuthorizedException("Invalid login."));

        if (!verifyPassword(request.getPassword(), person.getPassword())) {
            throw new NotAuthorizedException("Invalid login.");
        }

        if (needsPasswordUpgrade(person.getPassword())) {
            personService.changePassword(person.getId(), hashPassword(request.getPassword()));
        }

        return new AuthResponse(person, createToken(person));
    }

    public void changePassword(String authorizationHeader, ChangePasswordRequest request) {
        Long personId = requireUserId(authorizationHeader);
        Person person = personService.findById(personId)
                .orElseThrow(() -> new NotAuthorizedException("Invalid token."));

        if (!verifyPassword(request.getCurrentPassword(), person.getPassword())) {
            throw new NotAuthorizedException("Current password is not valid.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters.");
        }

        personService.changePassword(personId, hashPassword(request.getNewPassword()));
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

    private String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            secureRandom.nextBytes(salt);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, HASH_ITERATIONS, HASH_LENGTH);
            byte[] hash = SecretKeyFactory.getInstance(HASH_ALGORITHM).generateSecret(spec).getEncoded();

            return "pbkdf2$" + HASH_ITERATIONS + "$" + base64Url(salt) + "$" + base64Url(hash);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash password.", exception);
        }
    }

    private boolean verifyPassword(String password, String storedPassword) {
        if (password == null || storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        try {
            if (!isHashedPassword(storedPassword)) {
                return password.equals(storedPassword);
            }

            String[] parts = storedPassword.split("\\$");

            if (parts.length != 4) {
                return false;
            }

            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getUrlDecoder().decode(parts[2]);
            byte[] expectedHash = Base64.getUrlDecoder().decode(parts[3]);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, expectedHash.length * 8);
            byte[] actualHash = SecretKeyFactory.getInstance(HASH_ALGORITHM).generateSecret(spec).getEncoded();

            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (Exception exception) {
            return false;
        }
    }

    private boolean needsPasswordUpgrade(String storedPassword) {
        return storedPassword != null && !storedPassword.isBlank() && !isHashedPassword(storedPassword);
    }

    private boolean isHashedPassword(String storedPassword) {
        return storedPassword != null && storedPassword.startsWith("pbkdf2$");
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
