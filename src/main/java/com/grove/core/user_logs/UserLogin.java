package com.grove.core.user_logs;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "user_login")
public class UserLogin {

    @Id
    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "user_id", length = 100, nullable = false)
    private String userId;

    @Column(length = 30, nullable = false)
    private String role;

    @Column(name = "login_at", nullable = false)
    private Instant loginAt;

    @Column(name = "logout_at")
    private Instant logoutAt;

    @Column(length = 100)
    private String ip;

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
}
