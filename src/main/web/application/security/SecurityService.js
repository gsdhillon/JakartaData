import { requestJson } from "../../lib/Grove.js";

const securityApiUrl = "./api/security";

export const login = credentials =>
    requestJson(`${securityApiUrl}/login`, {
        method: "POST",
        body: JSON.stringify({
            userId: Number(credentials.userId),
            password: credentials.password
        })
    });

export const logout = authToken =>
    requestJson(`${securityApiUrl}/logout`, {
        method: "POST",
        authToken
    });

export const changePassword = (authToken, passwords) =>
    requestJson(`${securityApiUrl}/change-password`, {
        method: "POST",
        authToken,
        body: JSON.stringify(passwords)
    });
