import {
    createContext,
    createElement,
    useContext,
    useEffect,
    useState
} from "../Grove.js";
import { Div } from "./Div.js";

const toastDurationMs = 5000;
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

export const showAppError = error => {
    const id = `${Date.now()}-${Math.random()}`;
    const normalizedError =
        typeof error === "string"
            ? {
                errors: [error],
                status: "ERR",
                statusText: "Error"
            }
            : error || {};

    appErrorState.toasts = [
        {
            ...normalizedError,
            id
        },
        ...appErrorState.toasts
    ].slice(0, 5);
    notifyToasts();

    setTimeout(() => {
        clearAppError(id);
    }, toastDurationMs);
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
                        `HTTP ${toast.status} ${toast.statusText || ""} Content-Type: ${toast.contentType || "unknown"}`.trim()
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
                )
            )
        )
    );
};

export const RestErrorToasts = AppErrorToasts;
