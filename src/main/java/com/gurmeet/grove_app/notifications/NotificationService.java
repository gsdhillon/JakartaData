package com.gurmeet.grove_app.notifications;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class NotificationService {

    private final Map<String, List<NotificationDto>> notificationsByUser = new ConcurrentHashMap<>();

    public List<NotificationDto> findAll(String userId) {
        return notificationsByUser.getOrDefault(userId, List.of())
                .stream()
                .sorted(Comparator.comparing(NotificationDto::getCreatedAt).reversed())
                .toList();
    }

    public NotificationDto create(String userId, NotificationRequest request) {
        return notifyUser(
                userId,
                request.getTitle(),
                request.getMessage(),
                request.getType()
        );
    }

    public NotificationDto notifyUser(String userId, String title, String message, String type) {
        NotificationDto notification = new NotificationDto(
                UUID.randomUUID().toString(),
                clean(title, "Notification"),
                clean(message, "You have a new notification."),
                clean(type, "info"),
                Instant.now()
        );

        notificationsByUser.compute(userId, (key, existing) -> {
            List<NotificationDto> next = existing == null
                    ? new ArrayList<>()
                    : new ArrayList<>(existing);

            next.add(notification);
            return next;
        });
        notifyUserChanged(userId);

        return notification;
    }

    public void delete(String userId, String id) {
        List<NotificationDto> existing = notificationsByUser.getOrDefault(userId, List.of());
        boolean removed = existing.stream().anyMatch(notification -> notification.getId().equals(id));

        if (!removed) {
            throw new NotFoundException("Notification was not found.");
        }

        notificationsByUser.computeIfPresent(userId, (key, values) ->
                values.stream()
                        .filter(notification -> !notification.getId().equals(id))
                        .toList()
        );
        notifyUserChanged(userId);
    }

    public void deleteAll(String userId) {
        notificationsByUser.remove(userId);
        notifyUserChanged(userId);
    }

    private void notifyUserChanged(String userId) {
        NotificationWebSocket.notifyUser(userId, findAll(userId).size());
    }

    private String clean(String value, String fallback) {
        return value == null || value.isBlank()
                ? fallback
                : value.trim();
    }
}
