package com.grove.core.notifications;

import jakarta.websocket.CloseReason;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/notifications")
public class NotificationWebSocket {

    private static final Map<String, Set<Session>> SESSIONS_BY_USER = new ConcurrentHashMap<>();

    @OnOpen
    public void open(Session session) {
        String userId = first(session.getRequestParameterMap().get("userId"));

        if (userId == null || userId.isBlank()) {
            close(session, "Notification user id is required.");
            return;
        }

        session.getUserProperties().put("userId", userId);
        SESSIONS_BY_USER.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @OnClose
    public void close(Session session, CloseReason reason) {
        Object userId = session.getUserProperties().get("userId");

        if (userId instanceof String id) {
            Set<Session> sessions = SESSIONS_BY_USER.get(id);

            if (sessions != null) {
                sessions.remove(session);
            }
        }
    }

    static void notifyUser(String userId, int count) {
        String message = "{\"type\":\"notifications\",\"count\":" + count + "}";
        Set<Session> sessions = SESSIONS_BY_USER.get(userId);

        if (sessions == null) {
            return;
        }

        sessions.removeIf(session -> !session.isOpen());
        sessions.forEach(session -> session.getAsyncRemote().sendText(message));
    }

    private static String first(List<String> values) {
        return values == null || values.isEmpty()
                ? null
                : values.get(0);
    }

    private void close(Session session, String reason) {
        try {
            session.close(new CloseReason(CloseReason.CloseCodes.CANNOT_ACCEPT, reason));
        } catch (Exception ignored) {
            // Nothing useful to do for a failed close during handshake cleanup.
        }
    }
}
