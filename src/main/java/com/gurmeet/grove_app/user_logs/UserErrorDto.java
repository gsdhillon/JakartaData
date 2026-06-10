package com.gurmeet.grove_app.user_logs;

import java.time.Instant;

public class UserErrorDto {

    private Long id;
    private String sessionId;
    private String userId;
    private String req;
    private String method;
    private String error;
    private Instant createdAt;

    public UserErrorDto() {
    }

    public UserErrorDto(UserError error, String userId) {
        this.id = error.getId();
        this.sessionId = error.getSessionId();
        this.userId = userId;
        this.req = error.getReq();
        this.method = error.getMethod();
        this.error = error.getError();
        this.createdAt = error.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getReq() {
        return req;
    }

    public void setReq(String req) {
        this.req = req;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
