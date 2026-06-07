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
import { showAppError } from "./AppError.js";
import { Text } from "./Text.js";

const openEventName = "grove-rest-open";
const maxEntries = 10;
const defaultComposerHeaders = "Content-Type: application/json\nAccept: application/json";
const bootstrapAdminSampleBody = JSON.stringify(
    {
        name: "Ishjyot Kaur",
        designation: "Student",
        email: "ishjyot@gmail.com",
        gender: "Female",
        dob: "2004-09-23",
        mobileNo: "9920351796",
        password: "changeit"
    },
    null,
    2
);
const listeners = new Set();
const state = {
    enabled: false,
    entries: [],
    installed: false,
    originalFetch: null,
    pending: 0
};

const now = () =>
    new Date().toLocaleTimeString();

const notify = () => {
    if (typeof document !== "undefined") {
        document.documentElement.classList.toggle(
            "grove-rest-tap-has-entries",
            state.entries.length > 0
        );
        document.documentElement.classList.toggle(
            "grove-rest-tap-waiting",
            state.pending > 0
        );
    }

    listeners.forEach(listener => listener({
        enabled: state.enabled,
        entries: [...state.entries],
        pending: state.pending
    }));
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
    const normalizedContentType = contentType.toLowerCase();

    if (!normalizedContentType.includes("json")) {
        return [];
    }

    try {
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
    } catch {
        return [];
    }
};

const notifyHttpError = async response => {
    const errors = await parseErrorBody(response);
    const contentType = response.headers.get("Content-Type") || "unknown";

    showAppError({
        errors,
        contentType,
        status: response.status,
        statusText: response.statusText
    });
};

export const requestJson = async (url, options = {}) => {
    const {
        authToken,
        userId,
        ...fetchOptions
    } = options;
    const response = await fetch(url, {
        ...fetchOptions,
        headers: {
            ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...(userId ? { "X-User-Id": String(userId) } : {}),
            ...(fetchOptions.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
    }

    return response.status === 204
        ? null
        : response.json();
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

const parseHeaderText = headerText => {
    const headers = {};

    headerText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
            const separatorIndex = line.indexOf(":");

            if (separatorIndex < 1) {
                throw new Error(`Invalid header: ${line}`);
            }

            headers[line.slice(0, separatorIndex).trim()] =
                line.slice(separatorIndex + 1).trim();
        });

    return headers;
};

const normalizeApiEndpoint = endpoint =>
    String(endpoint || "")
        .trim()
        .replace(/^\.?\/?api\/?/i, "")
        .replace(/^\/+/, "");

const addEntry = entry => {
    state.entries = [
        entry,
        ...state.entries
    ].slice(0, maxEntries);
    notify();
};

const beginRequest = () => {
    state.pending += 1;
    notify();
};

const finishRequest = () => {
    state.pending = Math.max(0, state.pending - 1);
    notify();
};

const sendRestApiRequest = async ({
    body,
    endpoint,
    headerText,
    method
}) => {
    const normalizedEndpoint = normalizeApiEndpoint(endpoint);

    if (!normalizedEndpoint) {
        throw new Error("Enter an API endpoint.");
    }

    const headers = parseHeaderText(headerText);
    const url = `./api/${normalizedEndpoint}`;
    const requestBodyText = String(body || "");
    const request = {
        body: method === "GET" ? "" : requestBodyText,
        headers,
        method,
        url
    };
    const options = {
        headers,
        method
    };
    const startedAt = performance.now();
    const fetcher = state.originalFetch || window.fetch.bind(window);

    if (method !== "GET" && requestBodyText !== "") {
        options.body = requestBodyText;
    }

    beginRequest();

    try {
        const response = await fetcher(url, options);
        const responseData = await responseMeta(response);
        const entry = {
            id: `${Date.now()}-${Math.random()}`,
            durationMs: Math.round(performance.now() - startedAt),
            request,
            response: responseData,
            time: now()
        };

        addEntry(entry);

        if (!response.ok) {
            await notifyHttpError(response);
        }

        return entry;
    } catch (error) {
        const entry = {
            id: `${Date.now()}-${Math.random()}`,
            durationMs: Math.round(performance.now() - startedAt),
            error: error.message || String(error),
            request,
            response: null,
            time: now()
        };

        addEntry(entry);
        showAppError({
            errors: [error.message || String(error)],
            status: "ERR",
            statusText: "Network Error"
        });

        throw error;
    } finally {
        finishRequest();
    }
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

        beginRequest();

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

            showAppError({
                errors: [error.message || String(error)],
                status: "ERR",
                statusText: "Network Error"
            });

            throw error;
        } finally {
            finishRequest();
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
        entries: [...state.entries],
        pending: state.pending
    });

    installRestTap();

    useEffect(() => {
        listeners.add(setTapState);
        setTapState({
            enabled: state.enabled,
            entries: [...state.entries],
            pending: state.pending
        });

        return () => {
            listeners.delete(setTapState);
        };
    }, []);

    return createElement(
        "button",
        {
            "aria-label": tapState.enabled ? "Turn REST tap off" : "Turn REST tap on",
            "aria-pressed": tapState.enabled,
            className: [
                "grove-rest-toggle",
                tapState.enabled ? "grove-rest-toggle-on" : ""
            ].filter(Boolean).join(" "),
            title: tapState.enabled ? "Tap On" : "Tap Off",
            type: "button",
            onClick: toggleRestTap
        },
        createElement(
            "span",
            { className: "grove-rest-toggle-track" },
            createElement("span", { className: "grove-rest-toggle-knob" })
        ),
        createElement(
            "span",
            { className: "grove-rest-toggle-text" },
            "Tap"
        )
    );
};

export const useRestTapState = () => {
    const [tapState, setTapState] = useState({
        enabled: state.enabled,
        entries: [...state.entries],
        pending: state.pending
    });

    installRestTap();

    useEffect(() => {
        listeners.add(setTapState);
        setTapState({
            enabled: state.enabled,
            entries: [...state.entries],
            pending: state.pending
        });

        return () => {
            listeners.delete(setTapState);
        };
    }, []);

    return tapState;
};

export const RestTap = () => {
    const [entries, setEntries] = useState([...state.entries]);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(state.entries[0]?.id ?? null);
    const [tab, setTab] = useState("request");
    const [composerMethod, setComposerMethod] = useState("GET");
    const [composerEndpoint, setComposerEndpoint] = useState("");
    const [composerHeaders, setComposerHeaders] = useState(defaultComposerHeaders);
    const [composerBody, setComposerBody] = useState("");
    const [composerMessage, setComposerMessage] = useState("");
    const [composerBusy, setComposerBusy] = useState(false);

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
            entries: [...state.entries],
            pending: state.pending
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
    const sendComposerRequest = async () => {
        setComposerBusy(true);
        setComposerMessage("");

        try {
            const entry = await sendRestApiRequest({
                body: composerBody,
                endpoint: composerEndpoint,
                headerText: composerHeaders,
                method: composerMethod
            });

            setSelectedId(entry.id);
            setTab("response");
            setComposerMessage(`Sent ${entry.request.method} ${entry.response?.status ?? "ERR"}`);
        } catch (error) {
            setComposerMessage(error.message || String(error));
        } finally {
            setComposerBusy(false);
        }
    };
    const composeBootstrapAdmin = () => {
        setComposerMethod("POST");
        setComposerEndpoint("security/bootstrap-admin");
        setComposerHeaders(defaultComposerHeaders);
        setComposerBody(bootstrapAdminSampleBody);
        setComposerMessage("Bootstrap admin sample loaded. Edit values, then Send.");
        setTab("compose");
    };

    const content = Div(
        { className: "grove-rest-window" },
        Div(
            { className: "grove-rest-dialog-body" },
                Div(
                    { className: "list-group list-group-flush grove-rest-list" },
                    Div(
                        { className: "h6 m-0 p-3 border-bottom grove-rest-side-title" },
                        Text({
                            look: "title",
                            value: "REST API Calls"
                        })
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
                            className: tab === "compose" ? "grove-rest-tab-active" : "",
                            label: "Compose",
                            look: tab === "compose" ? "pm" : "ut",
                            type: "button",
                            onClick() {
                                setTab("compose");
                            }
                        }),
                        Button({
                            disabled: composerBusy,
                            icon: "person-fill-add",
                            label: null,
                            look: "ut",
                            title: "Load bootstrap admin request",
                            type: "button",
                            onClick: composeBootstrapAdmin
                        }),
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
                            icon: "x-lg",
                            label: null,
                            look: "sc",
                            title: "Close REST console",
                            type: "button",
                            onClick() {
                                setOpen(false);
                            }
                        })
                    ),
                    tab === "compose"
                        ? Div(
                            { className: "grove-rest-composer grove-rest-composer-main" },
                            Div(
                                { className: "grove-rest-composer-method-row" },
                                createElement(
                                    "select",
                                    {
                                        className: "form-select form-select-sm grove-rest-method",
                                        disabled: composerBusy,
                                        value: composerMethod,
                                        onChange(event) {
                                            setComposerMethod(event.target.value);
                                        }
                                    },
                                    ...["GET", "POST", "PUT", "PATCH", "DELETE"].map(method =>
                                        createElement(
                                            "option",
                                            {
                                                key: method,
                                                value: method
                                            },
                                            method
                                        )
                                    )
                                ),
                                Button({
                                    disabled: composerBusy,
                                    label: composerBusy ? "Sending" : "Send",
                                    look: "pm",
                                    type: "button",
                                    onClick: sendComposerRequest
                                })
                            ),
                            createElement(
                                "label",
                                { className: "grove-rest-url-field" },
                                createElement(
                                    "span",
                                    { className: "grove-rest-url-prefix" },
                                    "./api/"
                                ),
                                createElement(
                                    "input",
                                    {
                                        className: "form-control form-control-sm",
                                        disabled: composerBusy,
                                        placeholder: "persons/4",
                                        type: "text",
                                        value: composerEndpoint,
                                        onChange(event) {
                                            setComposerEndpoint(event.target.value);
                                        }
                                    }
                                )
                            ),
                            createElement(
                                "label",
                                { className: "grove-rest-composer-label" },
                                "Headers",
                                createElement(
                                    "textarea",
                                    {
                                        className: "form-control form-control-sm grove-rest-composer-headers",
                                        disabled: composerBusy,
                                        rows: 4,
                                        value: composerHeaders,
                                        onChange(event) {
                                            setComposerHeaders(event.target.value);
                                        }
                                    }
                                )
                            ),
                            createElement(
                                "label",
                                { className: "grove-rest-composer-label" },
                                "Body",
                                createElement(
                                    "textarea",
                                    {
                                        className: "form-control form-control-sm grove-rest-composer-body",
                                        disabled: composerBusy || composerMethod === "GET",
                                        placeholder: "{\n  \"name\": \"Gurmeet\"\n}",
                                        rows: 10,
                                        value: composerBody,
                                        onChange(event) {
                                            setComposerBody(event.target.value);
                                        }
                                    }
                                )
                            ),
                            composerMessage
                                ? Div(
                                    { className: "grove-rest-composer-message" },
                                    composerMessage
                                )
                                : null
                        )
                    : selectedEntry
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
    );

    return Div(
        { className: "grove-rest-dialog-backdrop" },
        Div(
            {
                "aria-modal": "true",
                className: "modal-content shadow grove-rest-dialog",
                role: "dialog"
            },
            content
        )
    )
};

export { AppErrorToasts as RestErrorToasts } from "./AppError.js";
export { RestTap as REST };
