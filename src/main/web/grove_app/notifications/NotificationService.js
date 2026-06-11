import { requestJson } from "../../grove_lib/Grove.js";

const notificationApiUrl = "./api/notifications";

export const findNotifications = authToken =>
    requestJson(notificationApiUrl, {
        authToken
    });

export const deleteNotification = (authToken, id) =>
    requestJson(`${notificationApiUrl}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        authToken
    });

export const deleteAllNotifications = authToken =>
    requestJson(notificationApiUrl, {
        method: "DELETE",
        authToken
    });

export const createTestNotification = (authToken, notification = {}) =>
    requestJson(`${notificationApiUrl}/test`, {
        method: "POST",
        authToken,
        body: JSON.stringify({
            title: notification.title || "Test notification",
            message: notification.message || "Notification service is connected.",
            type: notification.type || "info"
        })
    });

export const notificationSocketUrl = userId => {
    const protocol = window.location.protocol === "https:"
        ? "wss:"
        : "ws:";
    const contextPath = window.location.pathname.split("/").filter(Boolean)[0] || "";
    const basePath = contextPath ? `/${contextPath}` : "";

    return `${protocol}//${window.location.host}${basePath}/notifications?userId=${encodeURIComponent(userId)}`;
};
