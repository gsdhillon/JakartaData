/**
 * @file REST.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 *
 * Developer REST tap and API test console.
 *
 * This module adds a lightweight in-app REST inspector for Grove applications.
 * It wraps browser fetch calls, records request/response pairs, captures console
 * warnings/errors, and exposes a footer tap plus dialog where an application
 * programmer can inspect API traffic without opening browser DevTools.
 *
 * How it helps while building an app:
 * - Turn the footer REST tap on, use the app normally, then open the logo tap to
 *   inspect recent API requests, response status, headers, and sampled bodies.
 * - Use the Compose tab to manually test application endpoints under ./api/*.
 * - Failed HTTP/network calls are collected in Server Errors and highlighted in
 *   the footer so problems are visible during normal UI testing.
 * - A later successful 2xx response clears the footer error highlight, making it
 *   clear when the API has recovered.
 */

import {
    createContext,
    createElement,
    useContext,
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
const dummyConsoleContext = createContext(null);
// Sample body used by the Compose tab's bootstrap shortcut. Applications can
// adapt this payload and endpoint for their own first-admin/setup workflow.
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
    attention: "none",
    consoleEntries: [],
    enabled: false,
    entries: [],
    errorEntries: [],
    installed: false,
    installedErrorHandlers: false,
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
            state.attention === "activity"
        );
        document.documentElement.classList.toggle(
            "grove-rest-tap-has-console-warn",
            state.attention === "warn"
        );
        document.documentElement.classList.toggle(
            "grove-rest-tap-has-console-error",
            state.attention === "error"
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
    state.attention = "none";
    state.consoleEntries = [];
    state.entries = [];
    state.errorEntries = [];
    clearAppErrors();
    notify();
};

const clearRestAttention = () => {
    if (state.attention === "none") {
        return;
    }

    state.attention = "none";
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

const maskHeaderValue = (key, value) => {
    const text = String(value ?? "");

    if (
        key.toLowerCase() === "authorization" &&
        text.toLowerCase().startsWith("bearer ")
    ) {
        const token = text.slice(7).trim();

        if (token.length <= 14) {
            return `Bearer ${token}[${token.length}]`;
        }

        return `Bearer ${token.slice(0, 4)}...${token.slice(-6)}[${token.length}]`;
    }

    return text;
};

const formatHeaders = headers =>
    Object
        .entries(headers || {})
        .map(([key, value]) => `${key}: ${maskHeaderValue(key, value)}`)
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
        : "No console logs captured yet. Double click to generate dummy logs.";

const consoleLevelMeta = {
    debug: {
        icon: "bug",
        label: "Debug"
    },
    error: {
        icon: "x-octagon-fill",
        label: "Error"
    },
    info: {
        icon: "info-circle-fill",
        label: "Info"
    },
    log: {
        icon: "terminal",
        label: "Log"
    },
    warn: {
        icon: "exclamation-triangle-fill",
        label: "Warning"
    }
};

const stackFramePattern = /((?:https?:\/\/|file:\/\/\/|\/|\.\/|\.\.\/)[^\s)]+?\.js(?:\?[^:\s)]*)?):(\d+):(\d+)/;

const openStackFrame = frame => {
    if (typeof window === "undefined" || !frame?.url) {
        return;
    }

    window.open(`${frame.url}#L${frame.line}`, "_blank", "noopener,noreferrer");
};

const stackFrameOf = line => {
    const match = String(line || "").match(stackFramePattern);

    if (!match) {
        return null;
    }

    return {
        column: match[3],
        line: match[2],
        url: match[1]
    };
};

const renderConsoleMessage = message =>
    Div(
        { className: "grove-rest-console-message" },
        ...String(message || "")
            .split("\n")
            .map((line, index) => {
                const frame = stackFrameOf(line);

                if (!frame) {
                    return createElement(
                        "span",
                        {
                            className: "grove-rest-console-message-line",
                            key: index
                        },
                        line || " "
                    );
                }

                return createElement(
                    "button",
                    {
                        className: "grove-rest-console-message-line grove-rest-console-source-link",
                        key: index,
                        title: `Open ${frame.url}:${frame.line}:${frame.column}`,
                        type: "button",
                        onClick(event) {
                            event.stopPropagation();
                            openStackFrame(frame);
                        }
                    },
                    line
                );
            })
    );

const renderConsoleEntries = entries =>
    entries.length
        ? entries.map(entry => {
            const level = consoleLevelMeta[entry.level] || consoleLevelMeta.log;

            return Div(
                {
                    className: `grove-rest-console-entry grove-rest-console-entry-${entry.level}`,
                    key: entry.id
                },
                createElement("i", {
                    "aria-hidden": "true",
                    className: `bi bi-${level.icon} grove-rest-console-icon`
                }),
                Div(
                    { className: "grove-rest-console-entry-body" },
                    Div(
                        { className: "grove-rest-console-entry-meta" },
                        createElement(
                            "span",
                            { className: "grove-rest-console-level" },
                            level.label
                        ),
                        createElement(
                            "span",
                            { className: "grove-rest-console-time" },
                            entry.time
                        )
                    ),
                    renderConsoleMessage(entry.message)
                )
            );
        })
        : createElement(
            "pre",
            { className: "grove-rest-console-empty grove-rest-empty-state" },
            formatConsoleEntries(entries)
        );

const errorTitleOf = entry => {
    const status = entry.status ?? "ERR";
    const statusText = entry.statusText
        ? ` - ${entry.statusText}`
        : "";
    const contentType = entry.contentType
        ? ` [${entry.contentType}]`
        : "";

    return `${status}${statusText}${contentType}`;
};

const requestLineOf = entry =>
    entry.request
        ? `${entry.request.method} ${entry.request.url}`
        : entry.url || "";

const apiEntryStatusOf = entry => {
    if (!entry.response) {
        return "error";
    }

    if (entry.response.status >= 500) {
        return "error";
    }

    if (entry.response.status >= 400) {
        return "warn";
    }

    if (entry.response.status >= 300) {
        return "redirect";
    }

    return "ok";
};

const compactApiUrl = url =>
    String(url || "")
        .replace(/^\.?\/?api\/?/i, "")
        .replace(/^\/+/, "") || "/";

const renderErrorEntries = entries =>
    entries.length
        ? entries.map(entry =>
            Div(
                {
                    className: "grove-rest-error-entry",
                    key: entry.id
                },
                createElement("i", {
                    "aria-hidden": "true",
                    className: "bi bi-exclamation-triangle-fill grove-rest-error-entry-icon"
                }),
                Div(
                    { className: "grove-rest-error-entry-body" },
                    Div(
                        { className: "grove-rest-error-entry-meta" },
                        createElement(
                            "span",
                            { className: "grove-rest-error-entry-status" },
                            errorTitleOf(entry)
                        ),
                        createElement(
                            "span",
                            { className: "grove-rest-error-entry-time" },
                            entry.time
                        )
                    ),
                    requestLineOf(entry)
                        ? Div(
                            { className: "grove-rest-error-entry-request" },
                            requestLineOf(entry)
                        )
                        : null,
                    createElement(
                        "ul",
                        { className: "grove-rest-error-entry-list" },
                        (entry.errors && entry.errors.length
                            ? entry.errors
                            : ["No response error body."]
                        ).map((message, index) =>
                            createElement(
                                "li",
                                { key: `${entry.id}-${index}` },
                                message
                            )
                        )
                    )
                )
            )
        )
        : Div(
            { className: "grove-rest-empty-state" },
            "No REST errors captured yet."
        );

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

    if (entry.response?.ok) {
        clearRestAttention();
    } else if (entry.response && !entry.response.ok) {
        state.attention = "error";
    } else if (entry.error) {
        state.attention = "error";
    } else {
        state.attention = "activity";
    }

    notify();
};

const addConsoleEntry = entry => {
    state.consoleEntries = [
        entry,
        ...state.consoleEntries
    ].slice(0, maxConsoleEntries);

    if (entry.level === "error") {
        state.attention = "error";
    } else if (entry.level === "warn" && state.attention !== "error") {
        state.attention = "warn";
    } else if (state.attention === "none") {
        state.attention = "activity";
    }

    notify();
};

const installBrowserErrorCapture = () => {
    if (
        state.installedErrorHandlers ||
        typeof window === "undefined"
    ) {
        return;
    }

    state.installedErrorHandlers = true;

    window.addEventListener("error", event => {
        addConsoleEntry({
            id: `${Date.now()}-${Math.random()}`,
            level: "error",
            message: [
                event.message || "Uncaught error",
                event.filename ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}` : "",
                event.error?.stack || ""
            ].filter(Boolean).join("\n"),
            time: now()
        });
    });

    window.addEventListener("unhandledrejection", event => {
        const reason = event.reason;
        const message = reason instanceof Error
            ? reason.stack || reason.message
            : String(reason || "Unhandled promise rejection");

        addConsoleEntry({
            id: `${Date.now()}-${Math.random()}`,
            level: "error",
            message,
            time: now()
        });
    });
};

const addErrorEntry = entry => {
    state.attention = "error";
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

const generateDummyConsoleEntries = () => {
    console.log("Grove REST dummy log message");
    console.warn("Grove REST dummy warning message");
    console.error("Grove REST dummy error message");

    try {
        useContext(dummyConsoleContext);
    } catch (error) {
        console.error(error);
    }
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
    /*
     * Sends a request from the in-app Compose tab.
     *
     * The user types only the endpoint portion, for example "persons/4"; this
     * function normalizes that to "./api/persons/4", applies editable headers
     * and body, then records the request/response exactly like normal app API
     * traffic. This gives application programmers a quick way to test REST
     * endpoints from inside the running app and with the same browser/session.
     */
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
        } else {
            clearRestAttention();
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
    /*
     * Installs the global capture hooks once.
     *
     * The fetch wrapper is intentionally small: it lets the real request run
     * first, then records metadata for display in the REST dialog. Console
     * wrapping captures logs/warnings/errors so API failures and frontend errors
     * can be reviewed together while testing a workflow.
     */
    installBrowserErrorCapture();

    if (
        state.installed ||
        typeof window === "undefined" ||
        typeof window.fetch !== "function"
    ) {
        return;
    }

    state.installed = true;
    state.originalFetch = window.fetch.bind(window);
    installBrowserErrorCapture();

    ["log", "info", "warn", "error", "debug"].forEach(level => {
        if (typeof console?.[level] !== "function") {
            return;
        }

        state.originalConsole[level] = console[level].bind(console);
        console[level] = (...args) => {
            state.originalConsole[level](...args);

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

            if (response.ok) {
                clearRestAttention();
            }

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
    // Footer switch that enables/disables request logging without removing the
    // global error handling. When enabled, successful and failed API calls are
    // visible in the REST dialog.
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
            "aria-label": tapState.enabled ? "Turn API tap off" : "Turn API tap on",
            "aria-pressed": tapState.enabled,
            className: [
                "grove-rest-toggle",
                tapState.enabled ? "grove-rest-toggle-on" : ""
            ].filter(Boolean).join(" "),
            title: tapState.enabled ? "API Tap On" : "API Tap Off",
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
            "API"
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
    /*
     * Main REST dialog.
     *
     * Tabs:
     * - Console: captured console messages and uncaught browser errors.
     * - Server Errors: failed HTTP/network calls with parsed JSON error bodies.
     * - Compose: a small REST client for testing ./api endpoints.
     * - Details: request and response text for the selected captured API call.
     */
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
        // Preloads a POST request for the bootstrap-admin API. This is useful
        // when setting up a fresh development database or verifying that the
        // application's initial admin creation endpoint is working.
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
                                        `grove-rest-entry-${apiEntryStatusOf(entry)}`,
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
                                    { className: "grove-rest-entry-line" },
                                    createElement(
                                        "span",
                                        { className: "grove-rest-entry-method" },
                                        entry.request.method
                                    ),
                                    createElement(
                                        "span",
                                        { className: "grove-rest-entry-url" },
                                        compactApiUrl(entry.request.url)
                                    ),
                                    createElement(
                                        "span",
                                        { className: "grove-rest-entry-status" },
                                        entry.response?.status ?? "ERR"
                                    )
                                ),
                                Div(
                                    { className: "grove-rest-entry-sub" },
                                    createElement(
                                        "span",
                                        null,
                                        entry.time
                                    ),
                                    createElement(
                                        "span",
                                        null,
                                        `${entry.durationMs}ms`
                                    )
                                )
                            )
                        )
                        : Div(
                            { className: "grove-rest-empty grove-rest-empty-state" },
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
                            "div",
                            {
                                className: "grove-rest-payload grove-rest-console-payload",
                                title: "Double click to generate dummy logs",
                                onDblClick: generateDummyConsoleEntries
                            },
                            renderConsoleEntries(consoleEntries)
                        )
                    : tab === "errors"
                        ? createElement(
                            "div",
                            { className: "grove-rest-payload grove-rest-console-payload grove-rest-error-payload" },
                            renderErrorEntries(errorEntries)
                        )
                    : selectedEntry
                        ? Div(
                            { className: "grove-rest-combined-payload" },
                            Div(
                                { className: "grove-rest-detail-card grove-rest-detail-card-request" },
                                Div(
                                    { className: "grove-rest-detail-card-title" },
                                    createElement("i", {
                                        "aria-hidden": "true",
                                        className: "bi bi-arrow-up-right-circle"
                                    }),
                                    "Req"
                                ),
                                createElement(
                                    "pre",
                                    { className: "grove-rest-payload grove-rest-detail-card-payload" },
                                    formatRequest(selectedEntry)
                                )
                            ),
                            Div({ className: "grove-rest-payload-separator" }),
                            Div(
                                {
                                    className: [
                                        "grove-rest-detail-card",
                                        selectedEntry.response?.ok
                                            ? "grove-rest-detail-card-response-ok"
                                            : "grove-rest-detail-card-response-error"
                                    ].join(" ")
                                },
                                Div(
                                    { className: "grove-rest-detail-card-title" },
                                    createElement("i", {
                                        "aria-hidden": "true",
                                        className: "bi bi-arrow-down-left-circle"
                                    }),
                                    "Resp"
                                ),
                                createElement(
                                    "pre",
                                    { className: "grove-rest-payload grove-rest-detail-card-payload" },
                                    formatResponse(selectedEntry)
                                )
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
