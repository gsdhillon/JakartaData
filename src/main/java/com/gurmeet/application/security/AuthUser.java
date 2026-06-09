package com.gurmeet.application.security;

import jakarta.json.bind.annotation.JsonbTransient;

public class AuthUser {

    private Long id;
    private String name;
    private String role;
    private String avatar;
    private boolean passwordChangeRequired;

    @JsonbTransient
    private String password;

    public AuthUser() {
    }

    public AuthUser(Long id, String name, String role, String password, String avatar, boolean passwordChangeRequired) {
        this.id = id;
        this.name = name;
        this.role = UserAccessPolicy.normalizeRole(role);
        this.password = password;
        this.avatar = avatar;
        this.passwordChangeRequired = passwordChangeRequired;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return UserAccessPolicy.normalizeRole(role);
    }

    public void setRole(String role) {
        this.role = UserAccessPolicy.normalizeRole(role);
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public boolean isPasswordChangeRequired() {
        return passwordChangeRequired;
    }

    public void setPasswordChangeRequired(boolean passwordChangeRequired) {
        this.passwordChangeRequired = passwordChangeRequired;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
