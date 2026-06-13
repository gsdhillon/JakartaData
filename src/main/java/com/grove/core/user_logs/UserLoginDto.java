package com.grove.core.user_logs;

import java.time.Instant;

public class UserLoginDto {

    private String sessionId;
    private String userId;
    private String role;
    private Instant loginAt;
    private Instant logoutAt;
    private String ip;
    private long numErrors;

    public UserLoginDto() {
    }

    public UserLoginDto(UserLogin login, long numErrors) {
        this.sessionId = login.getSessionId();
        this.userId = login.getUserId();
        this.role = login.getRole();
        this.loginAt = login.getLoginAt();
        this.logoutAt = login.getLogoutAt();
        this.ip = login.getIp();
        this.numErrors = numErrors;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getLoginAt() {
        return loginAt;
    }

    public void setLoginAt(Instant loginAt) {
        this.loginAt = loginAt;
    }

    public Instant getLogoutAt() {
        return logoutAt;
    }

    public void setLogoutAt(Instant logoutAt) {
        this.logoutAt = logoutAt;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public long getNumErrors() {
        return numErrors;
    }

    public void setNumErrors(long numErrors) {
        this.numErrors = numErrors;
    }
}
