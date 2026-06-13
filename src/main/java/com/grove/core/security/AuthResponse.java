package com.grove.core.security;

public class AuthResponse {

    private AuthUser user;
    private String token;
    private String sessionId;

    public AuthResponse() {
    }

    public AuthResponse(AuthUser user, String token, String sessionId) {
        this.user = user;
        this.token = token;
        this.sessionId = sessionId;
    }

    public AuthUser getUser() {
        return user;
    }

    public void setUser(AuthUser user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
