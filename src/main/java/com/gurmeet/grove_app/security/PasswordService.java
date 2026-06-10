package com.gurmeet.grove_app.security;

import jakarta.enterprise.context.ApplicationScoped;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@ApplicationScoped
public class PasswordService {

    private static final String HASH_ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int HASH_ITERATIONS = 65536;
    private static final int HASH_LENGTH = 256;

    private final SecureRandom secureRandom = new SecureRandom();

    public String hashPassword(String password) {
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

    public boolean verifyPassword(String password, String storedPassword) {
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

    public boolean needsPasswordUpgrade(String storedPassword) {
        return storedPassword != null && !storedPassword.isBlank() && !isHashedPassword(storedPassword);
    }

    private boolean isHashedPassword(String storedPassword) {
        return storedPassword != null && storedPassword.startsWith("pbkdf2$");
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
}