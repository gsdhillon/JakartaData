import { requestJson } from "../../../grove_lib/GroveComponents.js";

const userLogsApiUrl = "./api/user-logs";

export const normalizeLogin = login => ({
    sessionId: login?.sessionId ?? "",
    userId: login?.userId ?? "",
    role: login?.role ?? "",
    loginAt: login?.loginAt ?? null,
    logoutAt: login?.logoutAt ?? null,
    ip: login?.ip ?? "",
    numErrors: login?.numErrors ?? 0
});

export const normalizeError = error => ({
    id: error?.id ?? "",
    sessionId: error?.sessionId ?? "",
    userId: error?.userId ?? "",
    req: error?.req ?? "",
    method: error?.method ?? "",
    error: error?.error ?? "",
    createdAt: error?.createdAt ?? null
});

export const findAllUserLogins = async authToken => {
    const logins = await requestJson(`${userLogsApiUrl}/logins`, { authToken });
    return (logins || []).map(normalizeLogin);
};

export const findUserLoginErrors = async (sessionId, authToken) => {
    const errors = await requestJson(
        `${userLogsApiUrl}/logins/${encodeURIComponent(sessionId)}/errors`,
        { authToken }
    );

    return (errors || []).map(normalizeError);
};
