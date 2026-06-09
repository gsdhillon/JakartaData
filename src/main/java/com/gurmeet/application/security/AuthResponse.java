package com.gurmeet.application.security;

public class AuthResponse {

    private AuthUser user;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(AuthUser user, String token) {
        this.user = user;
        this.token = token;
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
}
