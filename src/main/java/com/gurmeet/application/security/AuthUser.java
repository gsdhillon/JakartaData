package com.gurmeet.application.security;

import jakarta.json.bind.annotation.JsonbTransient;

public class AuthUser {

    // Canonical application identity. This is used for JWT subject, authorization, and future lookups.
    private String id;

    // Login identifier used for the current login. It may be id, email, mobile number, roll number, etc.
    private String loginId;
    private String name;
    private String role;
    private String email;
    private String mobileNo;
    private String avatar;
    private boolean passwordChangeRequired;

    @JsonbTransient
    private String password;

    public AuthUser() {
    }

    public AuthUser(String id, String loginId, String name, String role, String email, String mobileNo, String password, String avatar, boolean passwordChangeRequired) {
        this.id = id;
        setLoginId(loginId);
        this.name = name;
        this.role = UserAccessPolicy.normalizeRole(role);
        this.email = email;
        this.mobileNo = mobileNo;
        this.password = password;
        this.avatar = avatar;
        this.passwordChangeRequired = passwordChangeRequired;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        if (loginId == null || loginId.isBlank()) {
            throw new IllegalArgumentException("Auth user loginId is required.");
        }

        this.loginId = loginId.trim();
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobileNo() {
        return mobileNo;
    }

    public void setMobileNo(String mobileNo) {
        this.mobileNo = mobileNo;
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
