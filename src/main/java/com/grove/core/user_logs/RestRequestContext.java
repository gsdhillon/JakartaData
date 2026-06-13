package com.grove.core.user_logs;

public final class RestRequestContext {

    private static final ThreadLocal<RestRequest> CURRENT = new ThreadLocal<>();

    private RestRequestContext() {
    }

    public static void set(RestRequest request) {
        CURRENT.set(request);
    }

    public static RestRequest get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }

    public record RestRequest(String sessionId, String req, String method) {
    }
}
