import {
    createContext,
    createElement,
    useContext,
    useEffect,
    useState
} from "../Grove.js";
import { Div } from "./Div.js";

const toastDurationMs = 6000;
const toastListeners = new Set();
const appErrorState = {
    toasts: []
};

export const AppErrorContext = createContext({
    clearError() {
        clearAppErrors();
    },
    errorMessage: "",
    showError(error) {
        showAppError(error);
    }
});

export const useAppError = () =>
    useContext(AppErrorContext);

const notifyToasts = () => {
    toastListeners.forEach(listener => listener([...appErrorState.toasts]));
};

export const clearAppError = id => {
    appErrorState.toasts = appErrorState.toasts.filter(toast => toast.id !== id);
    notifyToasts();
};

export const clearAppErrors = () => {
    appErrorState.toasts = [];
    notifyToasts();
};

const scheduleAppErrorClear = id => {
    setTimeout(() => {
        const toast = appErrorState.toasts.find(currentToast => currentToast.id === id);

        if (toast && !toast.held) {
            clearAppError(id);
        }
    }, toastDurationMs);
};

export const setAppErrorHeld = (id, held) => {
    appErrorState.toasts = appErrorState.toasts.map(toast =>
        toast.id === id
            ? {
                ...toast,
                held
            }
            : toast
    );
    notifyToasts();

    if (!held) {
        scheduleAppErrorClear(id);
    }
};

export const showAppError = error => {
    const id = `${Date.now()}-${Math.random()}`;
    const normalizedError =
        typeof error === "string"
            ? {
                errors: [error],
                statusText: "Message"
            }
            : error || {};

    appErrorState.toasts = [
        {
            ...normalizedError,
            held: false,
            id
        },
        ...appErrorState.toasts
    ].slice(0, 5);
    notifyToasts();

    scheduleAppErrorClear(id);
};

export const AppErrorToasts = () => {
    const [toasts, setToasts] = useState([...appErrorState.toasts]);

    useEffect(() => {
        toastListeners.add(setToasts);
        setToasts([...appErrorState.toasts]);

        return () => {
            toastListeners.delete(setToasts);
        };
    }, []);

    if (!toasts.length) {
        return null;
    }

    const titleOf = toast =>
        toast.status !== undefined
            ? `HTTP ${toast.status} ${toast.statusText || ""} Content-Type: ${toast.contentType || "unknown"}`.trim()
            : toast.statusText || "Message";

    return createElement(
        "div",
        {
            "aria-live": "polite",
            className: "grove-rest-error-toasts"
        },
        toasts.map(toast =>
            createElement(
                "div",
                {
                    className: "grove-rest-error-toast grove-rest-error-message shadow",
                    key: toast.id,
                    role: "alert"
                },
                createElement(
                    "i",
                    {
                        "aria-hidden": "true",
                        className: "bi bi-exclamation-triangle-fill"
                    }
                ),
                Div(
                    { className: "grove-rest-error-body" },
                    Div(
                        { className: "grove-rest-error-title" },
                        titleOf(toast)
                    ),
                    toast.errors?.length
                        ? createElement(
                            "ul",
                            { className: "grove-rest-error-list" },
                            toast.errors.map((message, index) =>
                                createElement(
                                    "li",
                                    { key: `${toast.id}-${index}` },
                                    message
                                )
                            )
                        )
                        : null
                ),
                createElement(
                    "div",
                    { className: "grove-rest-error-actions" },
                    createElement(
                        "button",
                        {
                            "aria-label": "Dismiss error message",
                            className: "grove-rest-error-action",
                            onClick: event => {
                                event.stopPropagation();
                                clearAppError(toast.id);
                            },
                            title: "Dismiss",
                            type: "button"
                        },
                        createElement("i", {
                            "aria-hidden": "true",
                            className: "bi bi-x-lg"
                        })
                    ),
                    createElement(
                        "button",
                        {
                            "aria-label": toast.held
                                ? "Resume automatic dismissal"
                                : "Hold error message",
                            className: [
                                "grove-rest-error-action",
                                toast.held ? "grove-rest-error-action-held" : ""
                            ]
                                .filter(Boolean)
                                .join(" "),
                            onClick: event => {
                                event.stopPropagation();
                                setAppErrorHeld(toast.id, !toast.held);
                            },
                            title: toast.held ? "Release hold" : "Hold",
                            type: "button"
                        },
                        createElement("i", {
                            "aria-hidden": "true",
                            className: toast.held
                                ? "bi bi-pin-angle-fill"
                                : "bi bi-pin-angle"
                        })
                    )
                )
            )
        )
    );
};

export const RestErrorToasts = AppErrorToasts;
