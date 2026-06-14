import {
    createElement,
    useEffect,
    useState
} from "../../../grove_lib/GroveComponents.js";
import {
    deleteAllNotifications,
    deleteNotification,
    findNotifications,
    notificationSocketUrl
} from "./NotificationService.js";

const formatNotificationTime = value => {
    if (!value) {
        return "";
    }

    try {
        return new Date(value).toLocaleString();
    } catch {
        return String(value);
    }
};

const notificationTitle = notification =>
    notification.title || "Notification";

const notificationMessage = notification =>
    notification.message || "";

const stop = event => {
    if (typeof event.stopPropagation === "function") {
        event.stopPropagation();
    }
};

export const NotificationBell = props => {
    const {
        authToken,
        loggedIn,
        userId
    } = props;
    const [busy, setBusy] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const count = notifications.length;

    const loadNotifications = async () => {
        if (!authToken || !loggedIn) {
            setNotifications([]);
            return;
        }

        setBusy(true);
        try {
            setNotifications(await findNotifications(authToken));
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [authToken, loggedIn]);

    useEffect(() => {
        if (!loggedIn || !userId || typeof WebSocket === "undefined") {
            return undefined;
        }

        const socket = new WebSocket(notificationSocketUrl(userId));

        socket.onmessage = () => {
            loadNotifications();
        };

        return () => {
            socket.close();
        };
    }, [loggedIn, userId, authToken]);

    useEffect(() => {
        if (!dialogOpen) {
            return undefined;
        }

        const close = () => setDialogOpen(false);

        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [dialogOpen]);

    if (!loggedIn) {
        return null;
    }

    const removeNotification = async id => {
        setBusy(true);
        try {
            await deleteNotification(authToken, id);
            await loadNotifications();
        } finally {
            setBusy(false);
        }
    };
    const removeAllNotifications = async () => {
        setBusy(true);
        try {
            await deleteAllNotifications(authToken);
            await loadNotifications();
            setDialogOpen(false);
        } finally {
            setBusy(false);
        }
    };

    return createElement(
        "div",
        {
            className: "grove-notifications",
            onClick: stop
        },
        createElement(
            "button",
            {
                "aria-expanded": dialogOpen,
                "aria-label": `Notifications${count ? ` (${count})` : ""}`,
                className: [
                    "grove-notification-bell",
                    count ? "grove-notification-bell-active" : ""
                ].filter(Boolean).join(" "),
                title: "Notifications",
                type: "button",
                onClick() {
                    setDialogOpen(open => !open);
                }
            },
            createElement("i", {
                "aria-hidden": "true",
                className: count ? "bi bi-bell-fill" : "bi bi-bell"
            }),
            count
                ? createElement(
                    "span",
                    { className: "grove-notification-count" },
                    count > 99 ? "99+" : String(count)
                )
                : null
        ),
        dialogOpen
            ? createElement(
                "section",
                {
                    "aria-label": "Notifications",
                    className: "grove-notification-dialog shadow",
                    role: "dialog"
                },
                createElement(
                    "div",
                    { className: "grove-notification-dialog-header" },
                    createElement("span", null, "Notifications"),
                    createElement(
                        "button",
                        {
                            className: "grove-notification-clear-all",
                            disabled: busy || count === 0,
                            type: "button",
                            onClick: removeAllNotifications
                        },
                        "Delete all"
                    )
                ),
                createElement(
                    "div",
                    { className: "grove-notification-list" },
                    count
                        ? notifications.map(notification =>
                            createElement(
                                "article",
                                {
                                    className: "grove-notification-item",
                                    key: notification.id
                                },
                                createElement(
                                    "div",
                                    { className: "grove-notification-item-body" },
                                    createElement(
                                        "div",
                                        { className: "grove-notification-item-title" },
                                        notificationTitle(notification)
                                    ),
                                    notificationMessage(notification)
                                        ? createElement(
                                            "div",
                                            { className: "grove-notification-item-message" },
                                            notificationMessage(notification)
                                        )
                                        : null,
                                    createElement(
                                        "time",
                                        { className: "grove-notification-item-time" },
                                        formatNotificationTime(notification.createdAt)
                                    )
                                ),
                                createElement(
                                    "button",
                                    {
                                        "aria-label": `Delete ${notificationTitle(notification)}`,
                                        className: "grove-notification-delete",
                                        disabled: busy,
                                        title: "Delete notification",
                                        type: "button",
                                        onClick() {
                                            removeNotification(notification.id);
                                        }
                                    },
                                    createElement("i", {
                                        "aria-hidden": "true",
                                        className: "bi bi-trash"
                                    })
                                )
                            )
                        )
                        : createElement(
                            "div",
                            { className: "grove-notification-empty" },
                            busy ? "Loading notifications..." : "No notifications."
                        )
                )
            )
            : null
    );
};

export default NotificationBell;
