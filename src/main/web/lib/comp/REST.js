/**
 * @file REST.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    createElement,
    useEffect,
    useState
} from "../Grove.js";
import { Button } from "./Button.js";
import { Div } from "./Div.js";

const openEventName = "grove-rest-open";
const maxEntries = 10;
const toastDurationMs = 3000;
const listeners = new Set();
const toastListeners = new Set();
const state = {
    enabled: false,
    entries: [],
    installed: false,
    originalFetch: null,
    toasts: []
};

const now = () =>
    new Date().toLocaleTimeString();

const notify = () => {
    if (typeof document !== "undefined") {
        document.documentElement.classList.toggle(
            "grove-rest-tap-has-entries",
            state.entries.length > 0
        );
    }

    listeners.forEach(listener => listener({
        enabled: state.enabled,
        entries: [...state.entries]
    }));
};

const notifyToasts = () => {
    toastListeners.forEach(listener => listener([...state.toasts]));
};

const removeToast = id => {
    state.toasts = state.toasts.filter(toast => toast.id !== id);
    notifyToasts();
};

const addToast = toast => {
    const id = `${Date.now()}-${Math.random()}`;

    state.toasts = [
        {
            ...toast,
            id
        },
        ...state.toasts
    ].slice(0, 5);
    notifyToasts();

    setTimeout(() => {
        removeToast(id);
    }, toastDurationMs);
};

const toggleRestTap = () => {
    state.enabled = !state.enabled;
    notify();
};

const clearRestEntries = () => {
    state.entries = [];
    notify();
};

const headersToObject = headers => {
    const result = {};

    if (!headers) {
        return result;
    }

    new Headers(headers).forEach((value, key) => {
        result[key] = value;
    });

    return result;
};

const bodyToText = async body => {
    if (body === null || body === undefined) {
        return "";
    }

    if (typeof body === "string") {
        return body;
    }

    if (body instanceof URLSearchParams) {
        return body.toString();
    }

    if (body instanceof FormData) {
        return Array
            .from(body.entries())
            .map(([key, value]) => {
                const isFile =
                    typeof File !== "undefined" &&
                    value instanceof File;

                return `${key}: ${isFile ? value.name : value}`;
            })
            .join("\n");
    }

    if (body instanceof Blob) {
        return body.text();
    }

    return String(body);
};

const requestBody = async (input, init = {}) => {
    if (init.body !== undefined) {
        return bodyToText(init.body);
    }

    if (input instanceof Request) {
        try {
            return input.clone().text();
        } catch {
            return "";
        }
    }

    return "";
};

const requestMeta = async (input, init = {}) => {
    const request = input instanceof Request
        ? input
        : null;
    const method = init.method || request?.method || "GET";
    const url = request?.url || String(input);
    const headers = {
        ...headersToObject(request?.headers),
        ...headersToObject(init.headers)
    };

    return {
        body: await requestBody(input, init),
        headers,
        method,
        url
    };
};

const responseMeta = async response => ({
    body: await response.clone().text(),
    headers: headersToObject(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url
});

const parseErrorBody = async response => {
    const contentType = response.headers.get("Content-Type") || "";

    try {
        if (contentType.includes("application/json")) {
            const body = await response.clone().json();

            if (Array.isArray(body)) {
                return body.map(String);
            }

            if (Array.isArray(body?.errors)) {
                return body.errors.map(String);
            }

            if (body?.message) {
                return [String(body.message)];
            }

            return [JSON.stringify(body)];
        }

        const text = await response.clone().text();

        return text ? [text] : [];
    } catch {
        return [];
    }
};

const notifyHttpError = async response => {
    const errors = await parseErrorBody(response);

    addToast({
        errors: errors.length ? errors : [response.statusText || "Request failed"],
        status: response.status,
        statusText: response.statusText
    });
};

const formatHeaders = headers =>
    Object
        .entries(headers || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

const formatRequest = entry => [
    `${entry.request.method} ${entry.request.url} HTTP/1.1`,
    formatHeaders(entry.request.headers),
    "",
    entry.request.body || ""
].join("\n");

const formatResponse = entry => [
    `HTTP/1.1 ${entry.response?.status ?? "ERROR"} ${entry.response?.statusText ?? entry.error ?? ""}`.trim(),
    formatHeaders(entry.response?.headers),
    "",
    entry.response?.body ?? entry.error ?? ""
].join("\n");

const addEntry = entry => {
    state.entries = [
        entry,
        ...state.entries
    ].slice(0, maxEntries);
    notify();
};

export const installRestTap = () => {
    if (
        state.installed ||
        typeof window === "undefined" ||
        typeof window.fetch !== "function"
    ) {
        return;
    }

    state.installed = true;
    state.originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
        const startedAt = performance.now();
        const request = await requestMeta(input, init);

        try {
            const response = await state.originalFetch(input, init);
            const responseData = await responseMeta(response);

            if (state.enabled) {
                addEntry({
                    id: `${Date.now()}-${Math.random()}`,
                    durationMs: Math.round(performance.now() - startedAt),
                    request,
                    response: responseData,
                    time: now()
                });
            }

            if (!response.ok) {
                await notifyHttpError(response);
            }

            return response;
        } catch (error) {
            if (state.enabled) {
                addEntry({
                    id: `${Date.now()}-${Math.random()}`,
                    durationMs: Math.round(performance.now() - startedAt),
                    error: error.message || String(error),
                    request,
                    response: null,
                    time: now()
                });
            }

            addToast({
                errors: [error.message || String(error)],
                status: "ERR",
                statusText: "Network Error"
            });

            throw error;
        }
    };
};

export const openRestDialog = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(openEventName));
    }
};

export const RestTapToggle = () => {
    const [tapState, setTapState] = useState({
        enabled: state.enabled,
        entries: [...state.entries]
    });

    installRestTap();

    useEffect(() => {
        listeners.add(setTapState);
        setTapState({
            enabled: state.enabled,
            entries: [...state.entries]
        });

        return () => {
            listeners.delete(setTapState);
        };
    }, []);

    return Button({
        className: [
            "grove-rest-toggle",
            tapState.enabled ? "grove-rest-toggle-on" : ""
        ].filter(Boolean).join(" "),
        label: tapState.enabled ? "Tap On" : "Tap Off",
        look: tapState.enabled ? "ut" : "sc",
        type: "button",
        onClick: toggleRestTap
    });
};

export const RestTap = () => {
    const [entries, setEntries] = useState([...state.entries]);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(state.entries[0]?.id ?? null);
    const [tab, setTab] = useState("request");

    installRestTap();

    useEffect(() => {
        const syncEntries = nextState => {
            setEntries(nextState.entries);
            setSelectedId(currentId =>
                currentId && nextState.entries.some(entry => entry.id === currentId)
                    ? currentId
                    : nextState.entries[0]?.id ?? null
            );
        };
        const openDialog = () => {
            setEntries([...state.entries]);
            setSelectedId(currentId =>
                currentId && state.entries.some(entry => entry.id === currentId)
                    ? currentId
                    : state.entries[0]?.id ?? null
            );
            setOpen(currentOpen => !currentOpen);
        };

        listeners.add(syncEntries);
        window.addEventListener(openEventName, openDialog);
        syncEntries({
            enabled: state.enabled,
            entries: [...state.entries]
        });

        return () => {
            listeners.delete(syncEntries);
            window.removeEventListener(openEventName, openDialog);
        };
    }, []);

    if (!open) {
        return null;
    }

    const selectedEntry =
        entries.find(entry => entry.id === selectedId) ??
        entries[0] ??
        null;

    return Div(
        { className: "grove-rest-dialog-backdrop" },
        Div(
            {
                "aria-modal": "true",
                className: "modal-content shadow grove-rest-dialog",
                role: "dialog"
            },
            Div(
                { className: "grove-rest-dialog-body" },
                Div(
                    { className: "list-group list-group-flush grove-rest-list" },
                    Div(
                        { className: "h6 m-0 p-3 border-bottom grove-rest-side-title" },
                        "API Calls"
                    ),
                    entries.length
                        ? entries.map(entry =>
                            createElement(
                                "button",
                                {
                                    className: [
                                        "grove-rest-entry",
                                        "list-group-item",
                                        "list-group-item-action",
                                        entry.id === selectedEntry?.id
                                            ? "grove-rest-entry-active"
                                            : ""
                                    ].filter(Boolean).join(" "),
                                    key: entry.id,
                                    type: "button",
                                    onClick() {
                                        setSelectedId(entry.id);
                                    }
                                },
                                Div(
                                    { className: "grove-rest-entry-main" },
                                    `${entry.request.method} ${entry.response?.status ?? "ERR"}`
                                ),
                                Div(
                                    { className: "grove-rest-entry-sub" },
                                    `${entry.time} | ${entry.durationMs}ms`
                                )
                            )
                        )
                        : Div(
                            { className: "p-3 grove-rest-empty" },
                            "No API calls captured yet."
                        )
                ),
                Div(
                    { className: "grove-rest-detail" },
                    Div(
                        { className: "p-2 border-bottom d-flex gap-2 align-items-center grove-rest-tabs" },
                        Button({
                            className: tab === "request" ? "grove-rest-tab-active" : "",
                            disabled: !selectedEntry,
                            label: "Request",
                            look: tab === "request" ? "pm" : "sc",
                            type: "button",
                            onClick() {
                                setTab("request");
                            }
                        }),
                        Button({
                            className: tab === "response" ? "grove-rest-tab-active" : "",
                            disabled: !selectedEntry,
                            label: "Response",
                            look: tab === "response" ? "pm" : "sc",
                            type: "button",
                            onClick() {
                                setTab("response");
                            }
                        }),
                        Div({ className: "flex-grow-1" }),
                        Button({
                            disabled: entries.length === 0,
                            label: "Clear All",
                            look: "dn",
                            type: "button",
                            onClick() {
                                clearRestEntries();
                            }
                        }),
                        Button({
                            className: "grove-rest-close",
                            label: "Close",
                            look: "sc",
                            type: "button",
                            onClick() {
                                setOpen(false);
                            }
                        })
                    ),
                    selectedEntry
                        ? createElement(
                            "pre",
                            { className: "grove-rest-payload" },
                            tab === "request"
                                ? formatRequest(selectedEntry)
                                : formatResponse(selectedEntry)
                        )
                        : Div(
                            { className: "grove-rest-empty" },
                            "Turn Tap On and make an API call to view request and response details."
                        )
                )
            )
        )
    );
};

export const RestErrorToasts = () => {
    const [toasts, setToasts] = useState([...state.toasts]);

    installRestTap();

    useEffect(() => {
        toastListeners.add(setToasts);
        setToasts([...state.toasts]);

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
                    className: "grove-rest-error-toast shadow",
                    key: toast.id,
                    role: "alert"
                },
                Div(
                    { className: "grove-rest-error-title" },
                    `HTTP ${toast.status} ${toast.statusText || ""}`.trim()
                ),
                createElement(
                    "ul",
                    { className: "grove-rest-error-list" },
                    (toast.errors || []).map((error, index) =>
                        createElement(
                            "li",
                            { key: `${toast.id}-${index}` },
                            error
                        )
                    )
                )
            )
        )
    );
};

export { RestTap as REST };
