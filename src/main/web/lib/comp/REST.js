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
import {
    clearAppErrors,
    showAppError
} from "./AppError.js";
import { Text } from "./Text.js";

const openEventName = "grove-rest-open";
const groveLogoUrl = new URL("../grove-logo.svg", import.meta.url).href;
const maxEntries = 10;
const maxConsoleEntries = 100;
const maxErrorEntries = 100;
const maxCapturedBodyBytes = 100000;
const defaultComposerHeaders = "Content-Type: application/json\nAccept: application/json";
const bootstrapAdminSampleBody = JSON.stringify(
    {
        name: "Ishjyot Kaur",
        designation: "Student",
        password: "changeit"
    },
    null,
    2
);
const listeners = new Set();
const state = {
    consoleEntries: [],
    enabled: false,
    entries: [],
    errorEntries: [],
    installed: false,
    originalConsole: {},
    originalFetch: null,
    pending: 0
};

const now = () =>
    new Date().toLocaleTimeString();

const notify = () => {
    if (typeof document !== "undefined") {
        document.documentElement.classList.toggle(
            "grove-rest-tap-has-entries",
            state.entries.length > 0 ||
                state.consoleEntries.length > 0 ||
                state.errorEntries.length > 0
        );
        document.documentElement.classList.toggle(
            "grove-rest-tap-waiting",
            state.pending > 0
        );
    }

    listeners.forEach(listener => listener({
        enabled: state.enabled,
        consoleEntries: [...state.consoleEntries],
        entries: [...state.entries],
        errorEntries: [...state.errorEntries],
        pending: state.pending
    }));
};

const toggleRestTap = () => {
    state.enabled = !state.enabled;
    notify();
};

const clearRestEntries = () => {
    state.consoleEntries = [];
    state.entries = [];
    state.errorEntries = [];
    clearAppErrors();
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

const capturedBodyText = async response => {
    const contentLength = Number(response.headers.get("Content-Length") || 0);

    if (contentLength > maxCapturedBodyBytes) {
        return `[Body omitted: ${contentLength} bytes exceeds REST capture limit.]`;
    }

    const body = await response.clone().text();

    return body.length > maxCapturedBodyBytes
        ? `[Body omitted: ${body.length} characters exceeds REST capture limit.]`
        : body;
};

const responseMeta = async response => ({
    body: await capturedBodyText(response),
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

const notifyHttpError = async (response, request = null) => {
    const errors = await parseErrorBody(response);
    const contentType = response.headers.get("Content-Type") || "unknown";
    const error = {
        contentType,
        errors,
        request,
        status: response.status,
        statusText: response.statusText,
        url: response.url
    };

    addErrorEntry(error);

    showAppError(error);
};

export const requestJson = async (url, options = {}) => {
    const {
        authToken,
        timeoutMs = 15000,
        userId,
        ...fetchOptions
    } = options;
    const canAbort =
        typeof AbortController !== "undefined" &&
        !fetchOptions.signal &&
        timeoutMs > 0;
    const controller = canAbort
        ? new AbortController()
        : null;
    const timeoutId = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;
    let response;

    try {
        response = await fetch(url, {
            ...fetchOptions,
            signal: controller ? controller.signal : fetchOptions.signal,
            headers: {
                ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...(userId ? { "X-User-Id": String(userId) } : {}),
                ...(fetchOptions.headers || {})
            }
        });
    } catch (error) {
        if (error && error.name === "AbortError") {
            throw new Error("Request timed out.");
        }

        throw error;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

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

const shortenSampleString = value =>
    value.length > 100
        ? `${value.slice(0, 80)}...${value.slice(-10)} (${value.length})`
        : value;

const arrayTotalMarker = count =>
    `__GROVE_REST_ARRAY_TOTAL_${count}__`;

const unquoteArrayTotalMarkers = text =>
    text.replace(/"__GROVE_REST_ARRAY_TOTAL_(\d+)__"/g, "... total $1");

const sampleJsonValue = value => {
    if (typeof value === "string") {
        return shortenSampleString(value);
    }

    if (Array.isArray(value)) {
        return value.length
            ? [
                sampleJsonValue(value[0]),
                arrayTotalMarker(value.length)
            ]
            : [];
    }

    if (value && typeof value === "object") {
        return Object
            .entries(value)
            .reduce((sampled, [key, childValue]) => ({
                ...sampled,
                [key]: sampleJsonValue(childValue)
            }), {});
    }

    return value;
};

const formatBodySample = body => {
    const text = String(body || "");
    const trimmed = text.trim();

    if (!trimmed) {
        return "";
    }

    try {
        return unquoteArrayTotalMarkers(
            JSON.stringify(sampleJsonValue(JSON.parse(trimmed)), null, 2)
        );
    } catch {
        return text;
    }
};

const formatRequest = entry => [
    `${entry.request.method} ${entry.request.url} HTTP/1.1`,
    formatHeaders(entry.request.headers),
    "",
    formatBodySample(entry.request.body)
].join("\n");

const formatResponse = entry => [
    `HTTP/1.1 ${entry.response?.status ?? "ERROR"} ${entry.response?.statusText ?? entry.error ?? ""}`.trim(),
    formatHeaders(entry.response?.headers),
    "",
    entry.response
        ? formatBodySample(entry.response.body)
        : entry.error ?? ""
].join("\n");

const formatConsoleArg = value => {
    if (value instanceof Error) {
        return value.stack || value.message;
    }

    if (typeof value === "string") {
        return value;
    }

    if (value === null || value === undefined) {
        return String(value);
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const formatConsoleEntries = entries =>
    entries.length
        ? entries
            .map(entry => `[${entry.time}] ${entry.level.toUpperCase()}\n${entry.message}`)
            .join("\n\n")
        : "No console logs captured yet.";

const formatErrorEntries = entries =>
    entries.length
        ? entries
            .map(entry => [
                `[${entry.time}] HTTP ${entry.status} ${entry.statusText || ""}`.trim(),
                entry.request
                    ? `${entry.request.method} ${entry.request.url}`
                    : entry.url || "",
                `Content-Type: ${entry.contentType || "unknown"}`,
                "",
                entry.errors && entry.errors.length
                    ? entry.errors.join("\n")
                    : "No response error body."
            ].filter(line => line !== "").join("\n"))
            .join("\n\n")
        : "No REST errors captured yet.";

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

const addConsoleEntry = entry => {
    state.consoleEntries = [
        entry,
        ...state.consoleEntries
    ].slice(0, maxConsoleEntries);
    notify();
};

const addErrorEntry = entry => {
    state.errorEntries = [
        {
            id: `${Date.now()}-${Math.random()}`,
            time: now(),
            ...entry
        },
        ...state.errorEntries
    ].slice(0, maxErrorEntries);
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
            await notifyHttpError(response, request);
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
        const restError = {
            errors: [error.message || String(error)],
            request,
            status: "ERR",
            statusText: "Network Error"
        };

        addErrorEntry(restError);
        showAppError(restError);

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

    ["log", "info", "warn", "error", "debug"].forEach(level => {
        if (typeof console?.[level] !== "function") {
            return;
        }

        state.originalConsole[level] = console[level].bind(console);
        console[level] = (...args) => {
            state.originalConsole[level](...args);

            if (!state.enabled) {
                return;
            }

            addConsoleEntry({
                id: `${Date.now()}-${Math.random()}`,
                level,
                message: args.map(formatConsoleArg).join(" "),
                time: now()
            });
        };
    });

    window.fetch = async (input, init = {}) => {
        const startedAt = performance.now();
        const request = await requestMeta(input, init);

        beginRequest();

        try {
            const response = await state.originalFetch(input, init);

            if (state.enabled) {
                const responseData = await responseMeta(response);

                addEntry({
                    id: `${Date.now()}-${Math.random()}`,
                    durationMs: Math.round(performance.now() - startedAt),
                    request,
                    response: responseData,
                    time: now()
                });
            }

            if (!response.ok) {
                await notifyHttpError(response, request);
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

            const restError = {
                errors: [error.message || String(error)],
                request,
                status: "ERR",
                statusText: "Network Error"
            };

            addErrorEntry(restError);
            showAppError(restError);

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
        consoleEntries: [...state.consoleEntries],
        enabled: state.enabled,
        entries: [...state.entries],
        errorEntries: [...state.errorEntries],
        pending: state.pending
    });

    installRestTap();

    useEffect(() => {
        listeners.add(setTapState);
        setTapState({
            consoleEntries: [...state.consoleEntries],
            enabled: state.enabled,
            entries: [...state.entries],
            errorEntries: [...state.errorEntries],
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
        consoleEntries: [...state.consoleEntries],
        enabled: state.enabled,
        entries: [...state.entries],
        errorEntries: [...state.errorEntries],
        pending: state.pending
    });

    installRestTap();

    useEffect(() => {
        listeners.add(setTapState);
        setTapState({
            consoleEntries: [...state.consoleEntries],
            enabled: state.enabled,
            entries: [...state.entries],
            errorEntries: [...state.errorEntries],
            pending: state.pending
        });

        return () => {
            listeners.delete(setTapState);
        };
    }, []);

    return tapState;
};

export const RestTap = () => {
    const [consoleEntries, setConsoleEntries] = useState([...state.consoleEntries]);
    const [entries, setEntries] = useState([...state.entries]);
    const [errorEntries, setErrorEntries] = useState([...state.errorEntries]);
    const [maximized, setMaximized] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(state.entries[0]?.id ?? null);
    const [tab, setTab] = useState("details");
    const [composerMethod, setComposerMethod] = useState("GET");
    const [composerEndpoint, setComposerEndpoint] = useState("");
    const [composerHeaders, setComposerHeaders] = useState(defaultComposerHeaders);
    const [composerBody, setComposerBody] = useState("");
    const [composerMessage, setComposerMessage] = useState("");
    const [composerBusy, setComposerBusy] = useState(false);

    installRestTap();

    useEffect(() => {
        const syncEntries = nextState => {
            setConsoleEntries(nextState.consoleEntries);
            setEntries(nextState.entries);
            setErrorEntries(nextState.errorEntries);
            setSelectedId(currentId =>
                currentId && nextState.entries.some(entry => entry.id === currentId)
                    ? currentId
                    : nextState.entries[0]?.id ?? null
            );
        };
        const openDialog = () => {
            setConsoleEntries([...state.consoleEntries]);
            setEntries([...state.entries]);
            setErrorEntries([...state.errorEntries]);
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
            consoleEntries: [...state.consoleEntries],
            entries: [...state.entries],
            errorEntries: [...state.errorEntries],
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
            setTab("details");
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
                        createElement(
                            "img",
                            {
                                alt: "Grove logo",
                                className: "grove-rest-side-logo",
                                height: 40,
                                src: groveLogoUrl,
                                width: 40
                            }
                        ),
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
                                        setTab("details");
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
                            { className: "grove-rest-empty" },
                            "No API calls captured yet."
                        )
                ),
                Div(
                    { className: "grove-rest-detail" },
                    Div(
                        { className: "p-2 border-bottom d-flex gap-2 align-items-center grove-rest-tabs" },
                        Button({
                            className: tab === "console" ? "grove-rest-tab-active" : "",
                            label: `Console${consoleEntries.length ? ` (${consoleEntries.length})` : ""}`,
                            look: tab === "console" ? "pm" : "sc",
                            type: "button",
                            onClick() {
                                setTab("console");
                            }
                        }),
                        Button({
                            className: tab === "errors" ? "grove-rest-tab-active" : "",
                            label: `Server Errors${errorEntries.length ? ` (${errorEntries.length})` : ""}`,
                            look: tab === "errors" ? "pm" : "sc",
                            type: "button",
                            onClick() {
                                setTab("errors");
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
                            disabled: entries.length === 0 &&
                                consoleEntries.length === 0 &&
                                errorEntries.length === 0,
                            label: "Clear All",
                            look: "dn",
                            type: "button",
                            onClick() {
                                clearRestEntries();
                            }
                        }),
                        Button({
                            className: "grove-rest-window-action",
                            icon: maximized ? "fullscreen-exit" : "fullscreen",
                            label: null,
                            look: "sc",
                            title: maximized ? "Restore REST console" : "Maximize REST console",
                            type: "button",
                            onClick() {
                                setMaximized(current => !current);
                            }
                        }),
                        Button({
                            className: "grove-rest-close grove-rest-window-action",
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
                    : tab === "console"
                        ? createElement(
                            "pre",
                            { className: "grove-rest-payload grove-rest-console-payload" },
                            formatConsoleEntries(consoleEntries)
                        )
                    : tab === "errors"
                        ? createElement(
                            "pre",
                            { className: "grove-rest-payload grove-rest-console-payload" },
                            formatErrorEntries(errorEntries)
                        )
                    : selectedEntry
                        ? Div(
                            { className: "grove-rest-combined-payload" },
                            Div(
                                { className: "grove-rest-payload-title" },
                                "Request"
                            ),
                            createElement(
                                "pre",
                                { className: "grove-rest-payload" },
                                formatRequest(selectedEntry)
                            ),
                            Div({ className: "grove-rest-payload-separator" }),
                            Div(
                                { className: "grove-rest-payload-title" },
                                "Response"
                            ),
                            createElement(
                                "pre",
                                { className: "grove-rest-payload" },
                                formatResponse(selectedEntry)
                            )
                        )
                        : Div(
                            { className: "grove-rest-empty" },
                            "Turn Tap On and make an API call to view request and response details."
                        )
                )
        )
    );

    return Div(
        {
            className: [
                "grove-rest-dialog-backdrop",
                maximized ? "grove-rest-dialog-backdrop-maximized" : ""
            ].filter(Boolean).join(" ")
        },
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
